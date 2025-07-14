``Paddle Logo
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
API Reference
Overview
Authentication
Authentication
Permissions
Manage API keys
Rotate API keys
Core concepts
Versioning
Paddle IDs
Data types
Custom data
Rate limiting
Query & retrieval
Default scopes
Related entities
Filter and sort
Pagination
Response handling
Success responses
Errors
Entity management
Work with lists
Delete entities
Entities
Products
Prices
Discounts
Discount groups
Customers
Addresses
Businesses
Payment methods
Customer portal sessions
Transactions
Subscriptions
Adjustments
Pricing preview
Reports
Event types
Events
Notification settings
Notifications
Notification logs
Simulation types
Simulations
Simulation runs
Simulation run events
API Reference
Authentication
Authentication
Use Bearer authentication with API keys when making requests to the Paddle API.

Paddle offers two types of authentication credentials:

API keys
Used to interact with the Paddle API in your backend. For example, building subscription upgrade and downgrade workflows.

Intended only for server-side use.
Has full access to your data, limited only by the permissions assigned to the API key.
Must be kept secure and secret.
Client-side tokens
Used to work with Paddle.js in your frontend. For example, launching a checkout and previewing prices or transactions.

Intended only for client-side use.
Limited to opening checkouts, previewing prices, and previewing transactions.
Safe to publish in your app code.
This reference is about authenticating requests to the Paddle API in your backend. Don't call the Paddle API directly in your frontend. Use Paddle.js with client-side tokens instead.

Get an API key
An API key is required to authenticate requests to the Paddle API.

Create an API key

Keys can be created for either sandbox or live environments. Go to Paddle > Developer tools > Authentication to create a key.

Assign permissions

Permissions control what entities and operations the API key can access. Requests by keys without the required permissions fail with a forbidden error (403).

Check format

Your API key should be 69 characters long, be prefixed with pdl_, contain apikey_, and contain sdbx_ or live_ depending on the environment.

Treat your API key like a password. Keep it safe and never share it with apps or people you don't trust.

Authenticate requests
All requests to the Paddle API require authentication unless explicitly stated. The API uses Bearer authentication.

To authenticate, pass your Paddle API key using the Authorization header and the Bearer prefix. For example:


Authorization: Bearer pdl_sdbx_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO
Endpoints in the API have an Access-Control-Allow-Origin header to block direct access from browsers.

Test authentication
The quickest way to test authentication is to send a request to the /event-types endpoint. This endpoint returns data even without any entities in Paddle and doesn't require any permissions.

GET
https://api.paddle.com/event-types
cURL request

curl https://api.paddle.com/event-types -H "Authorization: Bearer pdl_sdbx_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO"
Response
If successful, you should get a response that includes a data array and a meta object.

200 OK

{
  "data": [
    {
      "name": "transaction.billed",
      "description": "Occurs when a transaction is billed. Its status field changes to billed and billed_at is populated.",
      "group": "Transaction",
      "available_versions": [
        1
      ]
    },
    {
      "name": "transaction.canceled",
      "description": "Occurs when a transaction is canceled. Its status field changes to canceled.",
      "group": "Transaction",
      "available_versions": [
        1
      ]
    },
    {
      "name": "transaction.completed",
If unsuccessful, Paddle returns a 403 error with information about what went wrong and how to troubleshoot.

Check the permissions assigned to your API key at Paddle > Developer tools > Authentication to ensure the key works with the endpoint you're trying to access.

Common errors
authentication_missing	The request doesn't include an Authorization header. Check that you're provided a header using Bearer authentication in your request.
authentication_malformed	The Authorization header is in the wrong format. Check that you set the Authorization header to Bearer <API key>.
invalid_token	The API key you're trying to access isn't correct. Check that you have provided the correct API key, that it's in the correct environment, and that it hasn't been revoked.
forbidden	The API key you're trying to use doesn't have the required permissions to perform the requested action. Check that the API key has the necessary permissions.
Related pages
Versioning
Read more
Errors
Read more
On this page
Authentication
Get an API key
Authenticate requests
Test authentication
Response
Common errors
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
Authentication - Paddle Developer``