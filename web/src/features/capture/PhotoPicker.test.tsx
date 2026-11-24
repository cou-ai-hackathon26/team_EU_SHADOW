import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import PhotoPicker from './PhotoPicker'
import { loadImage } from './loadImage'

vi.mock('./loadImage', () => ({
  loadImage: vi.fn(),
}))

const mockLoadImage = vi.mocked(loadImage)

describe('PhotoPicker (F2)', () => {
  let createdUrls: string[] = []
  let revokedUrls: string[] = []

  beforeEach(() => {
    createdUrls = []
    revokedUrls = []

    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      const url = `blob:test-image-${createdUrls.length}`
      createdUrls.push(url)
      return url
    })

    vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url: string) => {
      revokedUrls.push(url)
    })

    mockLoadImage.mockImplementation(async (_file: File | Blob) => {
      const img = new Image()
      return img
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('renders camera input with capture="environment" and gallery input with accept="image/*"', () => {
    render(<PhotoPicker />)

    const cameraInput = screen.getByLabelText(/ক্যামেরা/i) as HTMLInputElement
    expect(cameraInput).toBeInTheDocument()
    expect(cameraInput.getAttribute('capture')).toBe('environment')
    expect(cameraInput.getAttribute('accept')).toBe('image/*')

    const galleryInput = screen.getByLabelText(/গ্যালারি/i) as HTMLInputElement
    expect(galleryInput).toBeInTheDocument()
    expect(galleryInput.getAttribute('accept')).toBe('image/*')
    expect(galleryInput.hasAttribute('capture')).toBe(false)
  })

  it('rejects PDF or GIF with Bangla error message and does not show preview', async () => {
    render(<PhotoPicker />)
    const galleryInput = screen.getByLabelText(/গ্যালারি/i)

    const pdfFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    fireEvent.change(galleryInput, { target: { files: [pdfFile] } })

    expect(await screen.findByText(/JPG, PNG বা WebP/i)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders preview with alt text when a valid image is selected', async () => {
    render(<PhotoPicker />)
    const galleryInput = screen.getByLabelText(/গ্যালারি/i)

    const validFile = new File(['valid image bytes'], 'leaf.jpg', { type: 'image/jpeg' })
    fireEvent.change(galleryInput, { target: { files: [validFile] } })

    const img = await screen.findByRole('img')
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('alt')).toBeTruthy()
    expect(img.getAttribute('src')).toBe(createdUrls[0])
  })

  it('clears state and revokes object URL when "অন্য ছবি" is clicked', async () => {
    const user = userEvent.setup()
    render(<PhotoPicker />)
    const galleryInput = screen.getByLabelText(/গ্যালারি/i)

    const validFile = new File(['valid image bytes'], 'leaf.jpg', { type: 'image/jpeg' })
    fireEvent.change(galleryInput, { target: { files: [validFile] } })

    const img = await screen.findByRole('img')
    expect(img).toBeInTheDocument()

    const changeButton = screen.getByRole('button', { name: /অন্য ছবি/i })
    await user.click(changeButton)

    // Preview should be removed
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    // Old object URL must be revoked
    expect(revokedUrls).toContain(createdUrls[0])
  })

  it('revokes the old object URL when a new photo is picked', async () => {
    render(<PhotoPicker />)
    const galleryInput = screen.getByLabelText(/গ্যালারি/i)

    const file1 = new File(['file1'], 'leaf1.png', { type: 'image/png' })
    fireEvent.change(galleryInput, { target: { files: [file1] } })

    await screen.findByRole('img')
    const firstUrl = createdUrls[0]

    const file2 = new File(['file2'], 'leaf2.png', { type: 'image/png' })
    fireEvent.change(galleryInput, { target: { files: [file2] } })

    await waitFor(() => {
      expect(revokedUrls).toContain(firstUrl)
    })
  })

  it('shows error alert and renders no <img> when loadImage rejects', async () => {
    mockLoadImage.mockRejectedValueOnce(new Error('Corrupt image'))

    render(<PhotoPicker />)
    const galleryInput = screen.getByLabelText(/গ্যালারি/i)

    const file = new File(['corrupt'], 'corrupt.jpg', { type: 'image/jpeg' })
    fireEvent.change(galleryInput, { target: { files: [file] } })

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('handles race conditions: picks slow file A then fast file B, calling onImageReady once with B only', async () => {
    let resolveA: (img: HTMLImageElement) => void
    const promiseA = new Promise<HTMLImageElement>((resolve) => {
      resolveA = resolve
    })
    const imgA = new Image()
    imgA.src = 'blob:img-A'

    const imgB = new Image()
    imgB.src = 'blob:img-B'
    const promiseB = Promise.resolve(imgB)

    mockLoadImage
      .mockImplementationOnce(() => promiseA)
      .mockImplementationOnce(() => promiseB)

    const onImageReady = vi.fn()
    render(<PhotoPicker onImageReady={onImageReady} />)
    const galleryInput = screen.getByLabelText(/গ্যালারি/i)

    const fileA = new File(['fileA'], 'leafA.jpg', { type: 'image/jpeg' })
    const fileB = new File(['fileB'], 'leafB.jpg', { type: 'image/jpeg' })

    // Pick file A (slow)
    fireEvent.change(galleryInput, { target: { files: [fileA] } })

    // Pick file B (fast)
    fireEvent.change(galleryInput, { target: { files: [fileB] } })

    // Fast file B finishes
    await waitFor(() => {
      expect(onImageReady).toHaveBeenCalledWith(imgB, fileB)
    })

    // Now slow file A resolves
    resolveA!(imgA)

    // onImageReady should NOT have been called with A
    await new Promise((r) => setTimeout(r, 10))
    expect(onImageReady).toHaveBeenCalledTimes(1)
    expect(onImageReady).not.toHaveBeenCalledWith(imgA, fileA)
  })

  it('clicking "ক্যামেরা দিয়ে তুলুন" requests live camera stream and opens live camera modal', async () => {
    const user = userEvent.setup()
    const stopMock = vi.fn()
    const mockStream = {
      getTracks: () => [{ stop: stopMock }],
    }
    const getUserMediaMock = vi.fn().mockResolvedValue(mockStream)
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: getUserMediaMock,
      },
    })

    render(<PhotoPicker />)
    const cameraButton = screen.getByRole('button', { name: /ক্যামেরা দিয়ে তুলুন/i })
    await user.click(cameraButton)

    expect(getUserMediaMock).toHaveBeenCalledWith({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('camera-video-feed')).toBeInTheDocument()
  })

  it('capturing from camera modal produces an image file and stops all media tracks', async () => {
    const user = userEvent.setup()
    const stopMock = vi.fn()
    const mockStream = {
      getTracks: () => [{ stop: stopMock }],
    }
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    })

    const onImageReady = vi.fn()
    render(<PhotoPicker onImageReady={onImageReady} />)
    const cameraButton = screen.getByRole('button', { name: /ক্যামেরা দিয়ে তুলুন/i })
    await user.click(cameraButton)

    const captureButton = await screen.findByTestId('capture-from-camera-modal')
    await user.click(captureButton)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(stopMock).toHaveBeenCalled()
    await waitFor(() => {
      expect(onImageReady).toHaveBeenCalled()
    })
  })

  it('permission denial or getUserMedia error falls back cleanly to file picker and shows notice', async () => {
    const user = userEvent.setup()
    const getUserMediaMock = vi.fn().mockRejectedValue(new Error('Permission denied'))
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: getUserMediaMock,
      },
    })

    render(<PhotoPicker />)
    const cameraInput = screen.getByLabelText(/ক্যামেরা/i)
    const clickSpy = vi.spyOn(cameraInput, 'click')

    const cameraButton = screen.getByRole('button', { name: /ক্যামেরা দিয়ে তুলুন/i })
    await user.click(cameraButton)

    expect(await screen.findByText(/ক্যামেরা চালু করা যায়নি — ফাইল থেকে ছবি বেছে নিন/i)).toBeInTheDocument()
    expect(clickSpy).toHaveBeenCalled()
  })

  it('canceling camera modal closes dialog and stops all media tracks', async () => {
    const user = userEvent.setup()
    const stopMock = vi.fn()
    const mockStream = {
      getTracks: () => [{ stop: stopMock }],
    }
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    })

    render(<PhotoPicker />)
    await user.click(screen.getByRole('button', { name: /ক্যামেরা দিয়ে তুলুন/i }))
    const cancelButton = await screen.findByTestId('cancel-camera-modal')
    await user.click(cancelButton)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(stopMock).toHaveBeenCalled()
  })
})
