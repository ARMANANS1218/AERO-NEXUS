// Predefined chatbot knowledge base with questions and answers
export const chatbotKnowledge = {
  greetings: {
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
    responses: [
      "Hello! 👋 I'm EREN, your ChatCRM assistant. How can I help you today?",
      "Hi there! EREN here. I'm ready to assist you. What can I do for you?",
      "Hey! I'm EREN, welcome! Feel free to ask me anything about our services."
    ]
  },
  
  services: {
    keywords: ['service', 'services', 'what do you offer', 'what can you do', 'help', 'assist'],
    responses: [
      "We offer comprehensive CRM solutions including:\n• Customer Management\n• Live Chat Support\n• Email Management\n• Performance Analytics\n• Team Collaboration Tools\n\nWhat would you like to know more about?"
    ]
  },

  pricing: {
    keywords: ['price', 'pricing', 'cost', 'how much', 'payment', 'subscription', 'plan'],
    responses: [
      "Our pricing plans are:\n\n💼 Basic Plan - $29/month\n• Up to 5 agents\n• 1000 conversations/month\n• Email support\n\n🚀 Professional Plan - $79/month\n• Up to 20 agents\n• Unlimited conversations\n• Priority support\n• Advanced analytics\n\n🏢 Enterprise Plan - Custom\n• Unlimited agents\n• Custom integrations\n• Dedicated account manager\n\nWould you like to speak with our sales team?"
    ]
  },

  features: {
    keywords: ['feature', 'features', 'functionality', 'what can', 'capabilities'],
    responses: [
      "Our key features include:\n\n✨ Real-time Chat & Messaging\n📧 Integrated Email Management\n📞 Voice & Video Calls\n📊 Performance Analytics & Reports\n👥 Team Collaboration\n🔔 Smart Notifications\n📱 Mobile Responsive Design\n🌙 Dark Mode Support\n\nWhich feature would you like to know more about?"
    ]
  },

  account: {
    keywords: ['account', 'profile', 'login', 'register', 'sign up', 'sign in', 'password', 'forgot password'],
    responses: [
      "For account-related queries:\n\n🔐 Login Issues: Click 'Forgot Password' on the login page\n📝 New Account: Click 'Sign Up' to create an account\n👤 Profile Settings: Access via the profile icon in the header\n🔒 Security: We use industry-standard encryption\n\nNeed help with your account? I can connect you with support."
    ]
  },

  support: {
    keywords: ['support', 'help desk', 'customer service', 'contact', 'reach', 'get in touch'],
    responses: [
      "We're here to help! 24/7 support available:\n\n📧 Email: support@chatcrm.com\n📞 Phone: +1 (555) 123-4567\n💬 Live Chat: Click 'Connect to Agent' below\n🕐 Response Time: Usually within 2 hours\n\nWould you like me to connect you with a live agent now?"
    ]
  },

  integration: {
    keywords: ['integrate', 'integration', 'api', 'connect', 'third party', 'webhook'],
    responses: [
      "ChatCRM integrates with popular platforms:\n\n🔗 CRM Systems: Salesforce, HubSpot, Zoho\n📧 Email: Gmail, Outlook, SendGrid\n💬 Messaging: Slack, WhatsApp, Telegram\n📊 Analytics: Google Analytics, Mixpanel\n🛠️ Development: REST API, Webhooks\n\nNeed integration help? Let me connect you with our technical team."
    ]
  },

  technical: {
    keywords: ['error', 'bug', 'issue', 'problem', 'not working', 'broken', 'fix', 'technical'],
    responses: [
      "I'm sorry you're experiencing technical difficulties. Let me help:\n\n🔍 Common Solutions:\n• Clear browser cache and cookies\n• Try incognito/private mode\n• Check internet connection\n• Update to latest browser version\n\n⚠️ For technical issues, I recommend connecting with our technical support team who can diagnose and resolve the problem quickly.\n\nShall I connect you with technical support?"
    ]
  },

  billing: {
    keywords: ['bill', 'billing', 'invoice', 'payment', 'charge', 'refund', 'cancel subscription'],
    responses: [
      "Billing & Payment Information:\n\n💳 Payment Methods: Credit Card, PayPal, Bank Transfer\n📄 Invoices: Available in Account Settings\n🔄 Billing Cycle: Monthly or Annual\n❌ Cancellation: Anytime, no questions asked\n💰 Refund Policy: 30-day money-back guarantee\n\nFor billing inquiries, would you like to speak with our billing department?"
    ]
  },

  demo: {
    keywords: ['demo', 'trial', 'test', 'try', 'free trial', 'preview'],
    responses: [
      "Great! We offer a 14-day FREE trial:\n\n✅ Full access to all features\n✅ No credit card required\n✅ Cancel anytime\n✅ Personal onboarding session\n\nTo start your free trial:\n1. Click 'Sign Up' in the header\n2. Choose a plan (trial starts automatically)\n3. Set up your account\n\nWant me to help you get started?"
    ]
  },

  dataPrivacy: {
    keywords: ['privacy', 'data', 'security', 'gdpr', 'compliance', 'safe', 'secure'],
    responses: [
      "Your data security is our priority:\n\n🔒 Encryption: End-to-end encryption\n🛡️ Compliance: GDPR, CCPA, SOC 2 compliant\n🌍 Data Centers: Globally distributed\n🔐 Access Control: Role-based permissions\n📋 Privacy Policy: Available on our website\n\nWe never share your data with third parties.\n\nHave specific security questions? Connect with our security team."
    ]
  },

  training: {
    keywords: ['training', 'tutorial', 'learn', 'how to', 'guide', 'documentation', 'onboarding'],
    responses: [
      "Learning Resources:\n\n📚 Documentation: Comprehensive guides\n🎥 Video Tutorials: Step-by-step walkthroughs\n🎓 Webinars: Weekly training sessions\n💡 Knowledge Base: Searchable articles\n👨‍🏫 Personal Training: Available for Enterprise\n\nWhat would you like to learn about?"
    ]
  },

  analytics: {
    keywords: ['analytics', 'report', 'reports', 'statistics', 'metrics', 'dashboard', 'insights'],
    responses: [
      "Our Analytics & Reporting features:\n\n📊 Real-time Dashboards\n📈 Agent Performance Metrics\n⏱️ Response Time Analysis\n😊 Customer Satisfaction Scores\n📉 Conversion Tracking\n📅 Custom Date Ranges\n📥 Export Reports (PDF, CSV, Excel)\n\nWant to see a demo of our analytics?"
    ]
  },

  team: {
    keywords: ['team', 'agent', 'staff', 'employee', 'user management', 'add user'],
    responses: [
      "Team Management Features:\n\n👥 Unlimited Team Members (Pro+)\n🎭 Role-Based Access Control\n📊 Individual Performance Tracking\n🔄 Shift Management\n💬 Internal Chat & Collaboration\n📋 Task Assignment\n\nNeed help setting up your team?"
    ]
  },

  mobile: {
    keywords: ['mobile', 'app', 'android', 'ios', 'phone', 'smartphone'],
    responses: [
      "Mobile Access:\n\n📱 Responsive Web App: Works on all devices\n🍎 iOS App: Coming soon (Q2 2025)\n🤖 Android App: Coming soon (Q2 2025)\n💻 Desktop App: Available for Windows & Mac\n\nThe web version works perfectly on mobile browsers!\n\nWant to access ChatCRM on mobile?"
    ]
  },

  languages: {
    keywords: ['language', 'languages', 'translation', 'multilingual', 'international'],
    responses: [
      "Language Support:\n\n🌍 Available Languages:\n• English\n• Spanish\n• French\n• German\n• Portuguese\n• Chinese\n• Japanese\n• More coming soon!\n\n🔄 Auto-translation available for customer conversations\n\nNeed support in a specific language?"
    ]
  },

  automation: {
    keywords: ['automation', 'automate', 'automatic', 'bot', 'ai', 'chatbot', 'workflow'],
    responses: [
      "Automation Capabilities:\n\n🤖 Chatbot: Automated responses (what you're using now!)\n📧 Email Automation: Auto-responses, follow-ups\n🔔 Smart Notifications: Configurable alerts\n📋 Workflow Automation: Custom rules\n🎯 Lead Routing: Automatic assignment\n⏰ Scheduled Messages: Time-based actions\n\nInterested in automating your workflow?"
    ]
  },

  thanks: {
    keywords: ['thank', 'thanks', 'thank you', 'appreciate', 'helpful'],
    responses: [
      "You're very welcome! 😊 EREN is always here to help!",
      "Happy to assist! Feel free to ask if you need anything else.",
      "My pleasure! Have a great day! 🌟"
    ]
  },

  goodbye: {
    keywords: ['bye', 'goodbye', 'see you', 'later', 'exit', 'quit'],
    responses: [
      "Goodbye! EREN is here 24/7 if you need help. Have a great day! 👋",
      "Take care! Feel free to come back anytime. EREN will be waiting! 😊",
      "See you later! Don't hesitate to reach out again. Goodbye! 🌟"
    ]
  }
};

// Function to find best matching response
export const findBestResponse = (userMessage) => {
  const messageLower = userMessage.toLowerCase().trim();
  
  // Check for empty message
  if (!messageLower) {
    return {
      response: "I'm here to help! Please type your question or concern.",
      category: 'default',
      needsAgent: false
    };
  }

  let bestMatch = null;
  let highestScore = 0;

  // Check each category for keyword matches
  Object.entries(chatbotKnowledge).forEach(([category, data]) => {
    let score = 0;
    data.keywords.forEach(keyword => {
      if (messageLower.includes(keyword.toLowerCase())) {
        // Give higher score for exact matches
        score += keyword.split(' ').length;
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        category,
        responses: data.responses
      };
    }
  });

  // If good match found
  if (bestMatch && highestScore > 0) {
    const responses = bestMatch.responses;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      response: randomResponse,
      category: bestMatch.category,
      needsAgent: false
    };
  }

  // No match found - suggest connecting to agent
  return {
    response: "I'm EREN, and I'm not sure I fully understand your question. However, I can connect you with one of our live agents who will be happy to help!\n\n💬 Would you like to chat with a live agent?\n\nOr try asking about:\n• Our services and features\n• Pricing and plans\n• Technical support\n• Account help",
    category: 'unknown',
    needsAgent: true
  };
};

// Quick reply suggestions
export const quickReplies = [
  "What services do you offer?",
  "What are your pricing plans?",
  "I need technical support",
  "Connect me to an agent",
  "Tell me about features",
  "How do I sign up?"
];
