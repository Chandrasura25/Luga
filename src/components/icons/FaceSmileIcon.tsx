import React from "react";

interface FaceSmileIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const FaceSmileIcon = ({ className, ...props }: FaceSmileIconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path 
        d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-5-8a5.001 5.001 0 0 0 10 0h-2a3 3 0 0 1-6 0H7zm1-3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" 
      />
    </svg>
  );
};