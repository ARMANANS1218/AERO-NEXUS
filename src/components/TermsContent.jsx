import React from 'react';

export default function TermsContent() {
  return (
    <div className="space-y-4 text-sm leading-6 text-gray-700 dark:text-gray-200">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Terms & Conditions for CRM Access</h2>
      <p className="italic">(Applicable to Telecom Chat Support Customer Care Executives)</p>

      <ol className="list-decimal pl-5 space-y-3">
        <li>
          <span className="font-semibold">Purpose of Access:</span> This CRM system is provided exclusively for official telecom customer support activities. Access is granted only to authorized employees or agents of the company for handling customer interactions, queries, and service requests.
        </li>
        <li>
          <span className="font-semibold">Confidentiality:</span> All customer data, including personal details, billing information, and communication records, must be treated as strictly confidential. Data should not be copied, shared, or stored on personal devices or external drives. Disclosure of customer or company data to any unauthorized person or third party is strictly prohibited and will lead to disciplinary action or legal consequences.
        </li>
        <li>
          <span className="font-semibold">User Credentials:</span> Each user is responsible for maintaining the confidentiality of their CRM login ID and password. Sharing login credentials or using another employee’s account is not permitted. In case of suspected unauthorized access, the user must immediately inform the Team Leader or IT Administrator.
        </li>
        <li>
          <span className="font-semibold">System Usage:</span> The CRM must be used only for official telecom chat support operations. Unnecessary browsing, misuse of tools, or use of the system for non-work-related purposes is prohibited. Users must log out at the end of each shift and ensure no customer data is left open or visible.
        </li>
        <li>
          <span className="font-semibold">Data Accuracy & Compliance:</span> All updates and entries in the CRM must be accurate and based on verified information. Executives must follow telecom data protection, TRAI (Telecom Regulatory Authority of India), and company compliance policies while handling customer data.
        </li>
        <li>
          <span className="font-semibold">Monitoring & Audit:</span> All CRM activities are monitored and logged for quality, compliance, and security purposes. Any misuse, alteration, or unauthorized access attempt will result in investigation and potential disciplinary action.
        </li>
        <li>
          <span className="font-semibold">Communication Standards:</span> Executives must maintain professionalism and adhere to company communication guidelines while interacting with customers. Use of abusive, informal, or unverified communication through the CRM chat system is strictly prohibited.
        </li>
        <li>
          <span className="font-semibold">Violation & Disciplinary Action:</span> Any violation of these Terms & Conditions may lead to one or more of the following actions: Temporary or permanent suspension of CRM access; Issuance of warning or disciplinary notice; Termination of employment; Legal action, if required under company policy or applicable laws.
        </li>
        <li>
          <span className="font-semibold">Acceptance:</span> By logging into this CRM system, you acknowledge that you have read, understood, and agree to comply with the above Terms & Conditions.
        </li>
      </ol>
    </div>
  );
}
