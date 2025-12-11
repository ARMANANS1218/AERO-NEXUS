# 🎫 Ticket Widget Integration Guide

## Quick Start - Add Ticket Raise Widget to Your Website

### For React Applications (CHAT-CRM or Integrated Sites)  chnages

#### 1. **Import the Widget**
```jsx
import TicketRaiseWidget from './components/widgets/TicketRaiseWidget';
```

#### 2. **Add to Your App**
```jsx
function App() {
  // Get logged-in user from your auth system
  const user = JSON.parse(localStorage.getItem('user'));
  
  return (
    <div className="app">
      {/* Your app content */}
      <YourRoutes />
      <YourHeader />
      <YourContent />
      
      {/* Add Ticket Widget - it will float in bottom-right corner */}
      <TicketRaiseWidget
        apiKey="your-organization-api-key"  // Optional
        user={user}  // Required: Must have _id, name, email
        onTicketCreated={(ticket) => {
          console.log('New ticket created:', ticket.ticketId);
          // Optional: Show success message, redirect, etc.
        }}
      />
    </div>
  );
}
```

#### 3. **User Object Requirements**
The widget requires an authenticated user with:
```javascript
{
  _id: "user-id",
  name: "John Doe",  // or user_name
  email: "john@example.com"
}
```

**Important**: Widget will NOT show for guest/unauthenticated users.

---

## For External Websites (Shyeyes CRM Integration)

### Option 1: React Component (If using React)

1. **Copy the widget component** to your project:
   ```
   src/components/widgets/TicketRaiseWidget.jsx
   ```

2. **Install dependencies**:
   ```bash
   npm install axios react-toastify lucide-react
   ```

3. **Import and use** as shown above.

---

### Option 2: Standalone JavaScript (For any website)

Create a standalone version:

```html
<!-- Add to your HTML page -->
<div id="ticket-widget-root"></div>

<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://your-cdn.com/ticket-widget.min.js"></script>

<script>
  // Initialize widget
  TicketWidget.init({
    apiUrl: 'https://your-backend.com',
    apiKey: 'your-api-key',
    user: {
      _id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com'
    },
    onTicketCreated: function(ticket) {
      console.log('Ticket created:', ticket);
    }
  });
</script>
```

---

## Configuration Options

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiKey` | string | No | Organization API key for authentication |
| `user` | object | **Yes** | Logged-in user object with _id, name, email |
| `onTicketCreated` | function | No | Callback when ticket is successfully created |

### User Object Structure

```typescript
interface User {
  _id: string;           // User ID (required)
  name?: string;         // User's name (or user_name)
  user_name?: string;    // Alternative name field
  email: string;         // User's email (required)
}
```

---

## Example: Shyeyes CRM Integration

### In Your Main App Component

```jsx
import React, { useEffect, useState } from 'react';
import { ChatCRMWidget } from 'bitmax-crm-widget';  // Chat widget
import TicketRaiseWidget from './widgets/TicketRaiseWidget';  // Ticket widget

function ShyeyesApp() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load user from your auth system
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    setUser(loggedInUser);
  }, []);

  return (
    <div className="app">
      {/* Your app routes and content */}
      <Routes>
        {/* Your routes */}
      </Routes>

      {/* Chat Widget (for queries/conversations) */}
      <ChatCRMWidget
        apiKey="your-api-key"
        apiUrl="https://your-backend.com"
        user={user}
      />

      {/* Ticket Widget (for support tickets) */}
      {user && (
        <TicketRaiseWidget
          apiKey="your-api-key"
          user={user}
          onTicketCreated={(ticket) => {
            alert(`Support ticket ${ticket.ticketId} created!`);
          }}
        />
      )}
    </div>
  );
}
```

---

## Styling Customization

The widget uses Tailwind CSS classes. To customize:

### 1. **Change Colors**
Edit the gradient in `TicketRaiseWidget.jsx`:
```jsx
// Change this line:
className="bg-gradient-to-br from-blue-600 to-purple-600"

// To your brand colors:
className="bg-gradient-to-br from-green-600 to-teal-600"
```

### 2. **Change Position**
```jsx
// Default: bottom-right
className="fixed bottom-6 right-6"

// Bottom-left:
className="fixed bottom-6 left-6"

// Top-right:
className="fixed top-6 right-6"
```

### 3. **Change Size**
```jsx
// Button size
className="w-14 h-14"  // Default

// Modal size
className="w-[400px]"  // Default
className="w-[500px]"  // Larger
```

---

## API Configuration

### Backend URL
Set the API URL in the widget file or via environment variable:

```jsx
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

For production:
```bash
VITE_API_URL=https://your-production-backend.com
```

---

## Testing

### 1. **Login as Customer**
```javascript
// Make sure user is logged in
const user = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test User',
  email: 'test@example.com'
};
localStorage.setItem('user', JSON.stringify(user));
localStorage.setItem('token', 'your-jwt-token');
```

### 2. **Open Widget**
- Click the floating mail icon in bottom-right corner
- Fill in the form
- Click "Submit Ticket"

### 3. **Check Agent Dashboard**
- Login as Agent/Admin
- Go to Ticketing → All or Unassigned
- You should see the new ticket

---

## Troubleshooting

### Widget Not Showing
- ✅ Check if `user` object is present
- ✅ Verify user has `_id`, `name`, `email` fields
- ✅ Check browser console for errors

### Ticket Creation Failed
- ✅ Verify backend URL is correct
- ✅ Check if user has valid JWT token
- ✅ Verify API endpoint: `/api/v1/email-ticketing/tickets/create`
- ✅ Check backend logs for errors

### No Real-time Notifications
- ✅ Verify Socket.IO is running
- ✅ Check `/ticket` namespace is initialized
- ✅ Verify JWT token in socket handshake

---

## Complete Integration Example

```jsx
// App.jsx
import React, { useEffect, useState } from 'react';
import { ChatCRMWidget } from 'bitmax-crm-widget';
import TicketRaiseWidget from './components/widgets/TicketRaiseWidget';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleTicketCreated = (ticket) => {
    console.log('New support ticket:', ticket);
    // Optional: Show custom success message
    // Optional: Redirect to ticket list
    // Optional: Send analytics event
  };

  return (
    <>
      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Your app content */}
      <div className="app-content">
        {/* Your routes, components, etc. */}
      </div>

      {/* Chat Widget (for live chat queries) */}
      {user && (
        <ChatCRMWidget
          apiKey={process.env.REACT_APP_API_KEY}
          apiUrl={process.env.REACT_APP_API_URL}
          user={user}
          primaryColor="#4F46E5"
        />
      )}

      {/* Ticket Widget (for support tickets) */}
      {user && (
        <TicketRaiseWidget
          apiKey={process.env.REACT_APP_API_KEY}
          user={user}
          onTicketCreated={handleTicketCreated}
        />
      )}
    </>
  );
}

export default App;
```

---

## Support

For issues:
1. Check browser console for errors
2. Verify backend is running
3. Check user authentication
4. Review backend logs
5. Test API endpoint manually with Postman

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Copy widget component
3. ✅ Add to your app
4. ✅ Test with logged-in user
5. ✅ Customize styling (optional)
6. ✅ Deploy to production

**Your ticketing system is ready to use!** 🎉
