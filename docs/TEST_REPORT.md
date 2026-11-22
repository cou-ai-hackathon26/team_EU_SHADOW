# AgroLeaf AI — Comprehensive QA & Test Report (Feature F10)

**Author:** Md. Mehedi Hasan (`EnergiousNPC`), Team `EU_SHADOW`  
**Date:** 22 November 2026  
**Status:** ALL TESTS PASSING (100% Green)

---

## ১. নির্বাহী সারসংক্ষেপ (Executive Summary)
CoU AI Hackathon 2026-এর কঠোর নিয়ম ও বাস্তব মাঠপর্যায়ের চ্যালেঞ্জ মোকাবেলায় **AgroLeaf AI** ওয়েব অ্যাপ্লিকেশনে একটি সমন্বিত **Edge-Case QA ও End-to-End (E2E) টেস্ট স্যুট** তৈরি করা হয়েছে।
কৃষকের ফোন ক্যামেরা, প্রতিকূল পরিবেশ (কম আলো, অতিরিক্ত রোদ, হাত কাঁপা, শিশিরবিন্দু), ভুল ফাইল এবং অন-ডিভাইস এআই মডেলের ৪টি কনফিডেন্স টিয়ার নিখুঁতভাবে যাচাই করতে **৩৫টি এজ-কেস টেস্ট সিনারিও** প্রণয়ন করা হয়েছে।

---

## ২. এজ-কেস টেস্ট ক্যাটালগ (35 Edge-Case Scenarios)

| ID | নাম / দৃশ্যপট | ক্যাটাগরি | প্রত্যাশিত ফলাফল / আচরণ | স্ট্যাটাস |
|:---|:---|:---|:---|:---:|
| **EC-01** | `healthy_leaf_natural` | Class Coverage | High/Healthy Tier, সুষম সার পরামর্শ | PASS |
| **EC-02** | `healthy_leaf_morning_dew` | Class Coverage | শিশিরবিন্দু সত্ত্বেও সঠিক সুস্থ পাতা নির্ণয় | PASS |
| **EC-03** | `blast_leaf_early_spindle` | Class Coverage | ব্লাস্ট রোগ শনাক্তকরণ ও ১৬১২৩ হটলাইন | PASS |
| **EC-04** | `blast_leaf_multiple_lesions` | Class Coverage | ব্লাস্ট পুরাতন দাগ ও বিস্তার সতর্কতা | PASS |
| **EC-05** | `brown_spot_dense` | Class Coverage | বাদামি দাগ রোগ শনাক্তকরণ | PASS |
| **EC-06** | `brown_spot_faint` | Class Coverage | Medium Tier (শীর্ষ ২ অনুমান ও স্পষ্ট ছবির অনুরোধ) | PASS |
| **EC-07** | `leaf_smut_black_spots` | Class Coverage | লিফ স্মাট রোগ শনাক্তকরণ | PASS |
| **EC-08** | `leaf_smut_scattered` | Class Coverage | লিফ স্মাট শনাক্তকরণ | PASS |
| **EC-09** | `sheath_blight_lesion` | Class Coverage | খোলপোড়া রোগ শনাক্তকরণ | PASS |
| **EC-10** | `sheath_blight_advanced` | Class Coverage | তীব্র খোলপোড়া সতর্কতা ও ১৬১২৩ | PASS |
| **EC-11** | `tungro_yellow_orange` | Class Coverage | টুংরো হলুদাভ পাতা শনাক্তকরণ | PASS |
| **EC-12** | `tungro_stunted_leaf` | Class Coverage | টুংরো খর্বাকৃতির পাতা শনাক্তকরণ | PASS |
| **EC-13** | `blur_motion_slight` | Quality (Blur) | "ছবিটি ঝাপসা দেখাচ্ছে" ওয়ার্নিং (নন-ব্লকিং) | PASS |
| **EC-14** | `blur_severe_out_of_focus` | Quality (Blur) | তীব্র ঝাপসা সতর্কতা ও নতুন ছবির পরামর্শ | PASS |
| **EC-15** | `blur_hand_shake` | Quality (Blur) | হাত কাঁপার মোশন ব্লার শনাক্তকরণ | PASS |
| **EC-16** | `blur_dirty_lens` | Quality (Blur) | ক্যামেরার ধুলোবালির জন্য ঝাপসা সতর্কতা | PASS |
| **EC-17** | `blur_raindrops_on_lens` | Quality (Blur) | লেন্সে পানির ফোঁটাজনিত অস্বচ্ছতা শনাক্তকরণ | PASS |
| **EC-18** | `blur_macro_too_close` | Quality (Blur) | অতি নিকট দূরত্বের ফোকাসহীনতা সতর্কতা | PASS |
| **EC-19** | `dark_dusk_evening` | Quality (Dark) | "ছবিটি অতিরিক্ত অন্ধকার (আলো কম)" ওয়ার্নিং | PASS |
| **EC-20** | `dark_cloudy_overcast` | Quality (Dark) | মেঘলা দিনের কম আলো সতর্কতা | PASS |
| **EC-21** | `dark_shadow_farmer` | Quality (Dark) | কৃষকের শরীরের ছায়াজনিত অন্ধকার শনাক্তকরণ | PASS |
| **EC-22** | `dark_indoor_room` | Quality (Dark) | অপ্রতুল ঘরের আলোর সতর্কতা | PASS |
| **EC-23** | `dark_night_flash_off` | Quality (Dark) | রাতের ফ্ল্যাশহীন ছবি সতর্কতা | PASS |
| **EC-24** | `dark_under_canopy` | Quality (Dark) | পাতার ঘন আচ্ছাদনের নিচের অন্ধকার শনাক্তকরণ | PASS |
| **EC-25** | `bright_direct_sunlight` | Quality (Bright) | "ছবিটি অতিরিক্ত উজ্জ্বল (আলো বেশি)" ওয়ার্নিং | PASS |
| **EC-26** | `bright_phone_flash_glare` | Quality (Bright) | ক্যামেরার ফ্ল্যাশ গ্লেয়ার সতর্কতা | PASS |
| **EC-27** | `bright_white_washout` | Quality (Bright) | সাদা পটভূমিতে অতিরিক্ত আলোর সতর্কতা | PASS |
| **EC-28** | `bright_dew_reflection` | Quality (Bright) | শিশিরবিন্দুর প্রতিফলনে ঝলসে যাওয়া শনাক্তকরণ | PASS |
| **EC-29** | `not_rice_weed_leaf` | Not Rice | "এটি ধানপাতা মনে হচ্ছে না" সতর্কতা | PASS |
| **EC-30** | `not_rice_farmer_hand` | Not Rice | পাতা ছাড়া কৃষকের হাত/আঙুল শনাক্তকরণ | PASS |
| **EC-31** | `not_rice_mud_ground` | Not Rice | ক্ষেতের কাদা ও পানি শনাক্তকরণ | PASS |
| **EC-32** | `not_rice_sky_background`| Not Rice | আকাশ বা পটভূমির ছবি ফিল্টারিং | PASS |
| **EC-33** | `not_rice_blank_noise` | Not Rice | ফাঁকা বা এলোমেলো রঙিন নয়েজ ফিল্টারিং | PASS |
| **EC-34** | `oversized_file_11mb` | Validation | ১০ MB-এর বেশি ফাইল আপলোড প্রতিরোধ | PASS |
| **EC-35** | `invalid_extension_doc`| Validation | .txt / .pdf ফাইল প্রতিরোধ ও বার্তা প্রদর্শন | PASS |

---

## ৩. Playwright E2E কভারেজ (375px মোবাইল ও ডেস্কটপ)
1. **রেসপন্সিভনেস ও মোবাইল লেআউট (375px)**:
   - আইফোন / সাধারণ অ্যান্ড্রয়েড স্ক্রিন সাইজে (375px) ফুল ইন্টারফেস যাচাই করা হয়েছে। বটম ন্যাভিগেশন, কার্ড ও ফন্ট কোনো উপচে পড়া (overflow) ছাড়াই সুবিন্যস্ত।
2. **৪টি টিয়ার ও সেফটি লেয়ার**:
   - High, Medium, Low ("আমি নিশ্চিত নই"), এবং Not Rice ("এটি ধানপাতা মনে হচ্ছে না") টিয়ারগুলোর যথাযথ রেন্ডারিং।
   - ফলাফল স্ক্রিন এবং ইতিহাসে সরকারি কৃষি কল সেন্টার **১৬১২৩** ও দায়িত্বশীল এআই প্রাথমিক স্ক্রিনিং সতর্কতা সার্বক্ষণিক বিদ্যমান।
3. **অন-ডিভাইস স্টোরেজ ও ইতিহাস**:
   - IndexedDB-তে পূর্ববর্তী স্ক্যান রেকর্ড সংরক্ষণ, একক ডিলিট এবং "সব মুছুন" কনফার্মেশন ফ্লো সফলভাবে পরীক্ষিত।

---

## ৪. টেস্ট রান ফলাফল
```bash
> agroleaf-web@0.1.0 test
> vitest run

Test Files  25 passed (25)
     Tests  117 passed (117)
  Duration  16.8s
```
- **Linter (`oxlint`)**: 0 warnings, 0 errors.
- **Compiler (`tsc -b && vite build`)**: সম্পূর্ণ ত্রুটিমুক্ত ও প্রোডাকশন-রেডি।
