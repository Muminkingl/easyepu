Paddle Logo
Paddle Billing
Open checkout from iOS. Learn more
Search
Ctrl + K
Feedback
Dashboard
Home
Concepts
Build
Errors
Webhooks
API Reference
Paddle.js
Changelog
SDKs and Tools
Migrate
Paddle.js
Overview
Setup & Authentication
Manage client-side tokens
Include and initialize Paddle.js
Test Retain x Paddle.js
Methods
Paddle.Initialize()
Paddle.Update()
Paddle.Environment.set()
Paddle.Checkout.open()
Paddle.Checkout.updateCheckout()
Paddle.Checkout.updateItems()
Paddle.Checkout.close()
Paddle.PricePreview()
Paddle.Retain.demo()
Paddle.Retain.initCancellationFlow()
Paddle.Spinner.show()
Paddle.Spinner.hide()
Paddle.Status.libraryVersion
Paddle.TransactionPreview()
Hosted checkouts
URL parameters
HTML data attributes
HTML data attributes
Events
Overview
General
Items
Customer
Payment
Discount
paddlejs
Manage client-side tokens
Manage client-side tokens
Create, update, and revoke client-side tokens used to initialize Paddle.js in your frontend.

Client-side tokens let you interact with the Paddle platform in frontend code, like webpages or mobile apps.

They're intended only for client-side use.
They're limited to opening checkouts, previewing prices, and previewing transactions.
They're safe to publish and expose in your code.
By integrating with Paddle.js using client-side tokens, you are able to open checkouts, build custom checkout experiences, and preview prices in a pricing page.

Looking to integrate Paddle in your backend? Use the Paddle API with API keys instead.

How it works
When you initialize Paddle.js, you include a client-side token. Paddle uses your client-side token to identify your account and verify that you have permission to perform the requested action.

Using script tag
Using JavaScript package manager

<script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
<script type="text/javascript">
  Paddle.Initialize({ 
    token: 'live_7d279f61a3499fed520f7cd8c08' // replace with a client-side token
  });
</script>
Never use API keys with Paddle.js. API keys should be kept secret and away from the frontend. Revoke the key if it has been compromised. Use client-side tokens starting with test_ or live_.

Sandbox vs live workspaces
Paddle has separate sandbox and live workspaces, each with their own set of client-side tokens. This separation helps you safely test your integration without affecting real customer data or transactions.

Sandbox client-side tokens
Use these tokens as you build and test your integration.

They only work in the sandbox environment where no real money is involved.

Sandbox client-side tokens contain test_.

Create a sandbox client-side token in the sandbox dashboard.

Live client-side tokens
Use these tokens only when you're ready to process real transactions in your production app.

They only work in the live environment where real money is involved.

Live client-side tokens contain live_.

Create a live client-side token in the live dashboard.

Format
Client-side tokens always follow a specific format.

Always start with test_ or live_ to indicate the environment they are used for.
Contains a random string of 27 characters in length after the environment prefix.
Example of a client-side token

test_4s7gd50ap72ms92nnsa20ma61lt
live_7d279f61a3499fed520f7cd8c08
Regex pattern for client-side tokens

^(test|live)_[a-zA-Z0-9]{27}$
Create a client-side token
Go to Paddle > Developer Tools > Authentication.

Click the Client-side tokens tab.

Click New client-side token.

Enter a name and description for the client-side token.

Click Save.

Click the ... action menu next to the client-side token you want to use, then choose Copy.

You're ready to use the client-side token to initialize Paddle.js.

Illustration of the new token form in Paddle. It shows the name and description fields. There's a button that says Save.

Revoke a client-side token
Go to Paddle > Developer Tools > Authentication.

Click the Client-side tokens tab.

Click the ... action menu next to the client-side token you want to revoke, then choose Revoke.

Confirm you want to revoke the client-side token by filling in the confirmation box.

Illustration of the authentication screen in Paddle. It shows the client-side tokens tab. There's a list of client-side tokens with the three dots icon. The menu for the first token is open, showing options to revoke.

Related pages
Include and initialize Paddle.js
Read more
Paddle.Initialize() method
Read more
Pass checkout settings
Read more
On this page
Manage client-side tokens
How it works
Sandbox vs live workspaces
Format
Create a client-side token
Revoke a client-side token
Related pages
Paddle Logo

Status
Paddle.com
Security
Changelog
Sign up for developer updates
No marketing emails. Unsubscribe any time.

Enter your email
Subscribe
Privacy Policy
Terms
Paddle.com Market Ltd. © 2012–2025
