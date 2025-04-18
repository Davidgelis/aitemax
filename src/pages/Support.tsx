
import React from 'react';
import Navbar from '@/components/Navbar';

const Support = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 mt-8">
          <h1 className="text-3xl font-bold text-[#041524] mb-6">Support</h1>
          <p className="text-gray-700 mb-4">
            Welcome to the AITEMA support page. If you need assistance, please don't hesitate to reach out.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-3 text-[#084b49]">Contact Us</h2>
              <p className="text-gray-600 mb-4">Our support team is available to help you with any questions or issues.</p>
              <Button 
                variant="aurora" 
                className="w-full mt-2"
                onClick={() => window.location.href = 'mailto:support@aitema.com'}
              >
                Email Support
              </Button>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-3 text-[#084b49]">Documentation</h2>
              <p className="text-gray-600 mb-4">Check our documentation for guides and tutorials on using AITEMA.</p>
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => window.open('https://docs.aitema.com', '_blank')}
              >
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;

import { Button } from "@/components/ui/button";
