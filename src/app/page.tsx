import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplianceChat } from '@/components/compliance/ComplianceChat';
import { GuidelinesPanel } from '@/components/guidelines/GuidelinesPanel';
import { ViolationReportForm } from '@/components/report/ViolationReportForm';
import { Camera, BookOpen, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Murrayhill HOA Portal</h1>
            <p className="text-xs text-gray-400 mt-0.5">Architectural Review & Community Compliance</p>
          </div>
          <Link
            href="/admin"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Admin →
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="compliance">
          <TabsList className="mb-6 h-auto flex-wrap gap-y-1">
            <TabsTrigger value="compliance" className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 text-xs sm:text-sm">
              <Camera size={14} className="flex-shrink-0" />
              <span className="sm:hidden">Compliance</span>
              <span className="hidden sm:inline">Check Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="guidelines" className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 text-xs sm:text-sm">
              <BookOpen size={14} className="flex-shrink-0" />
              <span className="sm:hidden">Guidelines</span>
              <span className="hidden sm:inline">HOA Guidelines</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 text-xs sm:text-sm">
              <AlertTriangle size={14} className="flex-shrink-0" />
              <span className="sm:hidden">Report</span>
              <span className="hidden sm:inline">Report a Violation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compliance">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Check Your Property</h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload a photo of your property and our AI assistant will check it against Murrayhill HOA guidelines. You can also ask follow-up questions.
                For official guidelines and application forms for planned work,{' '}
                <a
                  href="https://www.murrayhillowners.com/committees/arc/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  visit the ARC page
                </a>
                .
              </p>
            </div>
            <ComplianceChat />
          </TabsContent>

          <TabsContent value="guidelines">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">HOA Guidelines</h2>
              <p className="text-sm text-gray-500 mt-1">
                Browse the full Murrayhill ARC Design Guidelines below. For specific guideline details and official application forms for planned work,{' '}
                <a
                  href="https://www.murrayhillowners.com/committees/arc/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  visit the ARC page on the Murrayhill Owners Association website
                </a>
                .
              </p>
            </div>
            <GuidelinesPanel />
          </TabsContent>

          <TabsContent value="report">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Report a Violation</h2>
              <p className="text-sm text-gray-500 mt-1">
                Notice a potential HOA violation in the neighborhood? Submit an anonymous report and the HOA board will review it for potential investigation.
              </p>
            </div>
            <ViolationReportForm />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-6 border-t border-gray-200 mt-8">
        <p className="text-xs text-gray-400 text-center">
          Murrayhill HOA · Beaverton, OR · AI assessments are preliminary only. Contact the ARC for official determinations.
        </p>
      </footer>
    </div>
  );
}
