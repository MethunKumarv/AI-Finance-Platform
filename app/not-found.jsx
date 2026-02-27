import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <div className="text-center space-y-6 max-w-md">
        <FileQuestion className="w-24 h-24 mx-auto text-blue-600 animate-bounce" />
        
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800">Page Not Found</h2>
          <p className="text-gray-600">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <Link href="/">
          <Button size="lg" className="mt-6">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;