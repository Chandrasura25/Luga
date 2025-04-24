import { Link } from "react-router-dom";

const SuccessPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful! 🎉</h1>
      <p className="text-gray-700 mb-6">
        Thank you for your purchase! Your transaction was successful.
      </p>
      <Link to="/home">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Go to Home
        </button>
      </Link>
    </div>
  );
};

export default SuccessPage;












// import { useEffect, useState } from "react";
// import { useSearchParams, Link } from "react-router-dom";

// const SuccessPage = () => {
//   const [searchParams] = useSearchParams();
//   const sessionId = searchParams.get("session_id");
//   const [loading, setLoading] = useState(true);
//   const [paymentStatus, setPaymentStatus] = useState(null);

//   useEffect(() => {
//     console.log("SUCESS PAGE")
//     if (sessionId) {
//       // Send sessionId to backend to verify payment
//       fetch(`https://www.luga-ai.com/api/stripe/verify-payment?session_id=${sessionId}`)
//         .then((res) => res.json())
//         .then((data) => {
//           console.log("Payment Verification Response:", data);
//           setPaymentStatus(data.status);
//           setLoading(false);
//         })
//         .catch((error) => {
//           console.error("Error verifying payment:", error);
//           setPaymentStatus("error");
//           setLoading(false);
//         });
//     } else {
//       setPaymentStatus("invalid");
//       setLoading(false);
//     }
//   }, [sessionId]);

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//       {loading ? (
//         <h1 className="text-xl font-semibold text-gray-600">Verifying payment...</h1>
//       ) : paymentStatus === "success" ? (
//         <>
//           <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful! 🎉</h1>
//           <p className="text-gray-700 mb-6">
//             Thank you for your purchase! Your transaction was successful.
//           </p>
//           <Link to="/home">
//             <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
//               Go to Home
//             </button>
//           </Link>
//         </>
//       ) : paymentStatus === "pending" ? (
//         <h1 className="text-xl font-semibold text-yellow-600">Payment is still processing...</h1>
//       ) : (
//         <>
//           <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Failed ❌</h1>
//           <p className="text-gray-700 mb-6">
//             Something went wrong. If you were charged, please contact support.
//           </p>
//           <Link to="/home">
//             <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
//               Go Back to Home
//             </button>
//           </Link>
//         </>
//       )}
//     </div>
//   );
// };

// export default SuccessPage;
