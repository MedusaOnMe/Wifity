export default function HeroSection() {
  return (
    <section className="py-8 md:py-12">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="font-display font-bold text-4xl md:text-5xl mb-4">
          Create with <span className="text-gradient">AI-Powered</span> Imagination
        </h1>
        <p className="text-gray-400 text-lg">
          Transform your text prompts into stunning visual creations with our advanced AI image generation
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass rounded-2xl p-5 md:p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#9333EA]/20 flex items-center justify-center mb-4">
            <i className="ri-lightbulb-flash-line text-xl text-[#9333EA]"></i>
          </div>
          <h3 className="font-display font-medium text-lg mb-2">Describe Your Vision</h3>
          <p className="text-gray-400 text-sm">Enter detailed prompts to guide the AI in creating exactly what you envision</p>
        </div>
        
        <div className="glass rounded-2xl p-5 md:p-6 flex flex-col items-center text-center animate-float">
          <div className="w-12 h-12 rounded-full bg-[#06B6D4]/20 flex items-center justify-center mb-4">
            <i className="ri-cpu-line text-xl text-[#06B6D4]"></i>
          </div>
          <h3 className="font-display font-medium text-lg mb-2">AI Generates Art</h3>
          <p className="text-gray-400 text-sm">Our advanced neural networks transform your words into stunning visuals</p>
        </div>
        
        <div className="glass rounded-2xl p-5 md:p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#EC4899]/20 flex items-center justify-center mb-4">
            <i className="ri-palette-line text-xl text-[#EC4899]"></i>
          </div>
          <h3 className="font-display font-medium text-lg mb-2">Download & Share</h3>
          <p className="text-gray-400 text-sm">Save your creations, build a gallery, or share directly to social media</p>
        </div>
      </div>
    </section>
  );
}
