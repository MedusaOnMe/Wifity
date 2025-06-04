export default function HeroSection() {
  const scrollToGenerator = () => {
    const element = document.getElementById("image-generator");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 text-center">
        {/* Simple title */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
            nofacify
          </h1>
          <p className="text-lg text-gray-600">
            CA: 5tTAohWn8aGvCgdzrcuvenCs5uthyE8yntMTffPBpump
          </p>
        </div>
      </div>
    </section>
  );
}
