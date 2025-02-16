import { Link } from "react-router-dom";

const CancelPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Canceled</h1>
      <p className="text-gray-700 mb-6">
        Your payment was not completed. If this was a mistake, you can try again.
      </p>
      <Link to="/home">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Go Back to Home
        </button>
      </Link>
    </div>
  );
};

export default CancelPage;