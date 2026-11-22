import type { I18nKeys } from './bn'

export const en: Record<I18nKeys, string> = {
  // App Shell & Header
  appTitle: 'AgroLeaf AI',
  appSubtitle: 'Rice Leaf Disease Early Screening',
  krishiCallCenter: 'Krishi Call Center 16123',
  callCenterShort: 'Call Center',
  screeningDisclaimerShort: 'Preliminary screening only, not a prescription. Call 16123 for agricultural guidance.',

  // Navigation
  navHome: 'Home',
  navWeather: 'Weather',
  navHistory: 'History',
  navHowItWorks: 'How it works',
  navAbout: 'About',

  // Home Hero
  homeHeroTitle: 'AgroLeaf AI — Rice Leaf Disease Screening',
  homeHeroDesc: 'Take a clear photo of an affected rice leaf or choose one from your gallery. The on-device AI model will assist in instant disease screening.',

  // History & About Placeholder screens
  historyTitle: 'Scan History',
  historyDesc: 'Previous screening results saved on your device will appear here.',
  aboutTitle: 'About',
  aboutDesc: 'AgroLeaf AI — Built by Team EU_SHADOW for CoU AI Hackathon 2026.',

  // Capture / PhotoPicker (F2)
  cameraBtn: 'Take with Camera',
  cameraBtnDesc: 'Directly scan rice leaf',
  galleryBtn: 'Choose from Gallery',
  galleryBtnDesc: 'Select saved leaf photo',
  chooseAnotherPhoto: 'Change Photo',
  previewAlt: 'Selected rice leaf photo',
  photoRejectedTitle: 'Could not accept photo',
  fallbackLeafPhoto: 'Rice leaf photo',
  errInvalidFormat: 'Only JPG, PNG, or WebP images are supported.',
  errFileTooLarge: 'Image size cannot exceed 10 MB.',
  errLoadFailed: 'Failed to process image. Please choose another photo.',

  // Sample Gallery
  sampleGalleryTitle: 'Or test with sample photos:',

  // Quality Hints (F3)
  qualityWarningTitle: 'Image Quality Warning:',
  qualityTooDark: 'The photo is too dark. Retake with more ambient light or flash.',
  qualityTooBright: 'The photo is overexposed. Avoid harsh direct sunlight or glare.',
  qualityTooBlurry: 'The photo appears blurry. Keep the camera steady for a sharper leaf photo.',
  qualityCanProceed: '(You can still proceed with this photo if you wish)',
  qualityGood: 'Photo lighting and sharpness are optimal for analysis.',

  // Analyze Button (F4)
  analyzeBtn: 'Analyze Leaf (রোগ শনাক্ত)',
  analyzingText: 'Analyzing...',

  // Result Tiers (F4)
  highConfidenceBadge: 'High Confidence',
  mediumConfidenceBadge: 'Moderate Confidence (Two Possibilities)',
  mediumConfidenceSingleBadge: 'Moderate Confidence',
  lowConfidenceBadge: 'Uncertain',
  lowConfidenceTitle: 'I am not sure',
  lowConfidenceDesc: 'The model could not identify any disease with certainty. Please seek direct guidance from a local agriculture extension officer.',
  notRiceTitle: 'Not a Rice Leaf',
  notRiceDesc: 'The uploaded image does not appear to be a rice leaf. Please upload a clear photo of an affected rice leaf.',

  clearerPhotoRequestTitle: 'Clearer Photo Requested:',
  clearerPhotoRequestDesc: 'The model is inconclusive. Please retake a clearer photo in good lighting for a conclusive screening.',

  option1Label: 'Option 1',
  option2Label: 'Option 2',
  possibleConditionLabel: 'Possible Condition',
  possibleConditionsHeading: 'Possible Conditions',

  confidenceLabel: 'Model Confidence',
  scanAnotherLeafBtn: 'Scan Another Leaf',
  pretrainedBadge: 'Temporary Prototype — Pretrained Model',

  // Error State (F4)
  errorTitle: 'Analysis Error',
  errorDesc: 'An error occurred while processing the image. Please try again or provide a different photo.',
  tryAgainBtn: 'Try Again',

  // Language Toggle
  langToggleBn: 'বাংলা',
  langToggleEn: 'English',
  langToggleAria: 'Switch Language (ভাষা পরিবর্তন করুন)',
}
