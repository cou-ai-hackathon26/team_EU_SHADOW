import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import PhotoPicker from './PhotoPicker'

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
  })

  afterEach(() => {
    vi.restoreAllMocks()
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
})
