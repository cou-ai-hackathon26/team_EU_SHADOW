export default function HowItWorks() {
  const steps = [
    {
      title: 'ছবি তোলা',
      desc: 'কৃষক আক্রান্ত ধানপাতার একটি স্পষ্ট ও আলোকিত ছবি ক্যামেরা দিয়ে তোলেন বা ফোন গ্যালারি থেকে নির্বাচন করেন।',
    },
    {
      title: 'প্রিপ্রসেসিং (২২৪×২২৪)',
      desc: 'মডেলের মান অনুযায়ী ছবিটি স্বয়ংক্রিয়ভাবে ক্রপ ও রিসাইজ করে ২২৪×২২৪ পিক্সেলে এবং স্ট্যান্ডার্ড স্বাভাবিকীকরণে রূপান্তর করা হয়।',
    },
    {
      title: 'ব্রাউজারে মডেল রান',
      desc: 'ওয়েব অ্যাসেম্বলি (WASM) প্রযুক্তি ব্যবহার করে এআই মডেল সরাসরি ফোনের ব্রাউজারে রান হয়। কোনো ক্লাউড সার্ভারের প্রয়োজন পড়ে না।',
    },
    {
      title: 'ক্যালিব্রেটেড কনফিডেন্স',
      desc: 'মডেলের মাত্রাতিরিক্ত আত্মবিশ্বাস ঠেকাতে টেম্পারেচার স্কেলিং প্রয়োগ করে প্রতিটি রোগের সম্ভাব্যতার সৎ ও নির্ভরযোগ্য পরিমাপ করা হয়।',
    },
    {
      title: '৪টি স্তর বা টিয়ার',
      desc: 'ফলাফল চারটি স্তরে বিভক্ত: নিশ্চিত (একক রোগ), দুটি সম্ভাবনা (টপ-২ অপশন), আমি নিশ্চিত নই (অস্পষ্ট ছবি), এবং ধানপাতা নয়।',
    },
    {
      title: 'সম্পূর্ণ গোপনীয়তা ও সুরক্ষা',
      desc: 'সমস্ত ডেটা ও ছবি প্রসেসিং লোকাল ডিভাইসেই হয়। ছবি কখনো ফোন থেকে বাইরে যায় না, কোনো লগইন বা ইন্টারনেট ডেটা খরচের বাধ্যবাধকতা নেই।',
    },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <h2 className="text-xl font-bold text-leaf-800">
        AI কীভাবে কাজ করে — পর্দার পেছনের প্রযুক্তি
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        কৃষকের হাতে স্বচ্ছ ও নির্ভরযোগ্য প্রযুক্তি পৌঁছে দেওয়াই আমাদের লক্ষ্য।
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {steps.map((step, idx) => (
          <div
            key={step.title}
            className="flex flex-col gap-1 rounded-xl bg-leaf-50 p-3.5 border border-leaf-100"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-leaf-600 text-xs font-semibold text-white">
                {idx + 1}
              </span>
              <h3 className="font-semibold text-slate-900">{step.title}</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 pl-8">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
