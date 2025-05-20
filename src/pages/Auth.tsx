
import React from 'react';
import Logo from '@/components/Logo';
import AuthForm from '@/components/AuthForm';
import { useAuthState } from '@/hooks/useAuthState';

/**
 * Auth page component that handles user authentication
 */
const Auth = () => {
  const { loading } = useAuthState();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#fafafa]">
      {/* Aurora background overlay */}
      <div 
        className="fixed inset-0 bg-aurora-gradient bg-aurora animate-aurora opacity-15 pointer-events-none"
        style={{ zIndex: -1 }}
      />
      
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        
        <h2 className="text-2xl font-semibold text-center mb-6 text-[#545454]">
          {loading ? 'Loading...' : 'Welcome'}
        </h2>
        
        {/* Simplified auth form */}
        <AuthForm />
        
        {/* Helpful troubleshooting tips */}
        <div className="mt-4 text-sm text-gray-500">
          <p className="font-medium">Having trouble logging in?</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Check your email and password</li>
            <li>Make sure you have a stable internet connection</li>
            <li>Try disabling VPN or proxy services if you're using them</li>
            <li>Try using a different browser or device</li>
            <li>Clear your browser cache and cookies</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Auth;
