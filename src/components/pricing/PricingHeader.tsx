interface PricingHeaderProps {
  title: string;
  subtitle?: string;
}

const PricingHeader = ({ title, subtitle }: PricingHeaderProps) => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      {subtitle && <p className="text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
};

export default PricingHeader;