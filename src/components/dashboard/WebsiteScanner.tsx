
import { WebScanner } from './WebScanner';

interface WebsiteScannerProps {
  onScan: (url: string, instructions: string) => void;
}

export const WebsiteScanner = ({ onScan }: WebsiteScannerProps) => {
  return (
    <WebScanner onWebsiteScan={onScan} />
  );
};
