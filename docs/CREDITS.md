# Credits & Acknowledgments — AgroLeaf AI

AgroLeaf AI is made possible by open-source technologies, publicly available agricultural datasets, research institutions, and foundational agronomic literature.

---

## ১. গবেষণা ও জাতীয় কৃষি প্রতিষ্ঠানসমূহ (Agricultural Institutions)

ধানের রোগবালাই শনাক্তকরণ ও কৃষক নির্দেশনার বিষয়বস্তু নিম্নলিখিত জাতীয় ও আন্তর্জাতিক কৃষি সংস্থার গবেষণাপত্র ও নির্দেশিকা অনুসরণে প্রস্তুত:
- **বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (BRRI - Bangladesh Rice Research Institute)**: ধানের প্রধান রোগসমূহ (ব্লাস্ট, বাদামি দাগ, খোলপোড়া, টুংরো, লিফ স্মাট) নির্ণয় ও সাংস্কৃতিক দমন ব্যবস্থাপনার প্রধান তথ্যসূত্র।
- **কৃষি সম্প্রসারণ অধিদপ্তর (DAE - Department of Agricultural Extension)**: মাঠপর্যায়ের পরামর্শ ও উপসহকারী কৃষি কর্মকর্তা (SAAO) সমন্বয়।
- **কৃষি তথ্য সার্ভিস (AIS) ও কৃষি কল সেন্টার ১৬১২৩**: বাংলাদেশের কৃষকদের তাৎক্ষণিক টেলিফোনিক বিশেষজ্ঞ সেবা।
- **আন্তর্জাতিক ধান গবেষণা ইনস্টিটিউট (IRRI - International Rice Research Institute)**: রাইস ডক্টরস (Rice Doctor) রোগ নির্ণয় নির্দেশিকা।

> **দায়িত্বশীল নির্দেশনা**: AgroLeaf AI কোনো বাণিজ্যিক রাসায়নিক বা কীটনাশকের নাম/ডোজ সুপারিশ করে না। শুধুমাত্র প্রাথমিক প্রতিরোধ, সুষম সার ও কৃষি বিশেষজ্ঞের পরামর্শ অনুসরণের দিকনির্দেশনা প্রদান করা হয়েছে।

---

## ২. গবেষণার উপাত্ত ও ডেটাসেট (Datasets)

- **RiceLeafDiseaseBD v3**:
  - *Authors:* Munna MMH et al.
  - *Repository:* Mendeley Data (2026)
  - *DOI:* [10.17632/86s4jzj2m4.3](https://doi.org/10.17632/86s4jzj2m4.3)
  - *Licence:* Creative Commons Attribution 4.0 International (CC BY 4.0)
- **BanglaRiceLeaf Dataset**:
  - *Repository:* Harvard Dataverse
  - *DOI:* [10.7910/DVN/XAOBYW](https://doi.org/10.7910/DVN/XAOBYW)
  - *Licence:* Creative Commons Zero 1.0 Public Domain (CC0 1.0)

---

## ৩. ফ্রন্টএন্ড ও অন-ডিভাইস রানটাইম (Frontend & Browser Runtime)

- **React 19** ([facebook/react](https://github.com/facebook/react)) — Meta Platforms, Inc. (MIT License)
- **onnxruntime-web / ONNX Runtime Web (WASM)** ([microsoft/onnxruntime](https://github.com/microsoft/onnxruntime)) — Microsoft Corporation (MIT License)
- **Vite 6** ([vitejs/vite](https://github.com/vitejs/vite)) — Yuxi (Evan) You & Vite Contributors (MIT License)
- **Tailwind CSS v4** ([tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss)) — Tailwind Labs, Inc. (MIT License)
- **idb (IndexedDB Wrapper)** ([jakearchibald/idb](https://github.com/jakearchibald/idb)) — Jake Archibald (ISC License)
- **Vitest & @testing-library/react** ([vitest-dev/vitest](https://github.com/vitest-dev/vitest), [testing-library](https://github.com/testing-library)) — Vitest Team & Testing Library Contributors (MIT License)
- **Vite PWA Plugin** ([vite-pwa/vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa)) — Anthony Fu & Vite PWA Contributors (MIT License)
- **Open-Meteo** ([open-meteo.com](https://open-meteo.com)) — Open-source weather forecast API for division-level disease risk estimation (Creative Commons Attribution 4.0 International, CC BY 4.0)

---

## ৪. মেশিন লার্নিং ফ্রেমওয়ার্ক (Machine Learning Stack)

- **PyTorch** ([pytorch/pytorch](https://github.com/pytorch/pytorch)) — PyTorch Foundation & Linux Foundation (Modified BSD License)
- **timm (PyTorch Image Models)** ([huggingface/pytorch-image-models](https://github.com/huggingface/pytorch-image-models)) — Ross Wightman (Apache License 2.0)
- **Albumentations** ([albumentations-team/albumentations](https://github.com/albumentations-team/albumentations)) — Albumentations Team (MIT License)
- **ONNX** ([onnx/onnx](https://github.com/onnx/onnx)) — LF Projects, LLC (Apache License 2.0)

---

## ৫. এআই সহায়তা ও স্বচ্ছতা (AI Assistance Disclosure - Rule 10/12)

হ্যাকাথন নীতিমালা অনুসারে দলীয় কার্যক্রমে কৃত্রিম বুদ্ধিমত্তা টুলের ব্যবহারের স্বচ্ছ বিবরণ:
- **Claude Code (Anthropic)**: রিপোজিটরির প্রাথমিক কাঠামো, কোড রিভিউ আর্কিটেকচার, সিআই ভ্যালিডেশন এবং প্রযুক্তিগত পর্যালোচনায় সহায়ক ভূমিকা পালন করেছে।
- **Gemini Antigravity (Google DeepMind)**: দলের সদস্যদের ফিচার কোডিং, কঠোর টিডিডি টেস্ট প্রণয়ন, অফলাইন স্টোরেজ এবং লোকাল মিররিং প্রক্রিয়ায় সহায়ক হিসেবে কাজ করেছে।
- সকল কোড, মডেল ও সিদ্ধান্ত দলের সদস্যদের দ্বারা স্বহস্তে যাচাইকৃত, পরীক্ষিত এবং পরিচালিত।
