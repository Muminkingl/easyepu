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
Manage API keys
Manage API keys
Create, update, and revoke API keys used to authenticate server-side requests to the Paddle API.

API keys are secure credentials that authenticate your requests to the Paddle API. They give you programmatic access to create transactions, manage subscriptions, and work with other entities in your Paddle account.

They're intended only for server-side use.
They have full access to your data, limited only by the permissions assigned to the API key.
They must be kept secure and secret.
By integrating with the Paddle API using API keys, you can handle provisioning, build more granular custom payment flows, and automate tasks.

Looking to integrate Paddle in your frontend? Use Paddle.js with client-side tokens instead.

How it works
When you make requests to the Paddle API, include your API key in the Authorization header to authenticate your request. Paddle uses your API key to identify your account and verify that you have permission to perform the requested action.

Example authenticated request to view all transactions

curl -X GET "https://api.paddle.com/transactions" \
-H "Authorization: Bearer pdl_sdbx_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO"
You're in control over the security and use of your API keys, with key features including:

Use seperate API keys for testing
Use separate API keys for sandbox and live environments to safely test without affecting production data.

Check the format of your API keys
Each key follows a standardized format to make it easier to identify and avoid issues when making requests.

Limit access using permissions
Assign permissions to your API keys to control what actions they can perform.

Expire and rotate your API keys
Limit the lifetime of your API keys and rotate them regularly to reduce the risk of exposure.

Check and revoke leaked API keys
Prevent bad actors from using your API key by checking API keys and revoking those which have been leaked.

Store and use API keys securely
Follow best practices and treat your API keys as sensitive security credentials.

Sandbox vs live
Paddle has separate sandbox and live environments, each with their own set of API keys. This separation helps you safely test your integrations, avoids impacting real customer data, and reduces the risk of exposing your API keys.

Sandbox API keys
Use these keys as you build and test your integration.

They only work in the sandbox environment where no real money is involved.

Sandbox API keys created after May 6, 2025 contain sdbx_.

Create a sandbox API key in the sandbox dashboard.

Live API keys
Use these keys only when you're ready to process real transactions in your production app.

They only work in the live environment where real money is involved.

Live API keys created after May 6, 2025 contain live_.

Create a live API key in the live dashboard.

Format
All API keys created after May 6, 2025 follow the standard format. You can identify these keys by the prefix pdl_. Keys created before this date follow the legacy format.

API keys always follow a specific format.

Standard format
Legacy format
Always start with pdl_ to identify them as Paddle API keys.
Contain either live_ or sdbx_ after the prefix to identify the environment they're used for.
Have apikey_ after the environment to identify them as API keys instead of client-side tokens.
Have five underscores (_) within the key.
Are 69 characters in length.
Example of standard format API keys

pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO
pdl_sdbx_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO
Regex pattern for standard format API keys

^pdl_(live|sdbx)_apikey_[a-z\d]{26}_[a-zA-Z\d]{22}_[a-zA-Z\d]{3}
API keys are case-sensitive.

Permissions
When you create an API key, you must select which permissions to assign to it. You can select multiple permissions for a single key.

You can have multiple API keys with different permissions. This lets you control which app or integration has access to which parts of your Paddle account.

To change the permissions assigned to an API key, edit the API key.

Requests made with API keys that don't have the required permissions return a forbidden error (403).

Expiration
API keys can have an expiry date. This is the date when the API key is no longer valid. Expiry dates are useful to limit the lifetime of a key and reduce the risk of exposure.

You can set the expiry date when you create the API key. The default expiry date is 90 days from the date of creation and can't be more than one year from the date of creation.

We strongly recommend setting an expiry date for your API keys. API keys can be used to access sensitive data and should be rotated regularly.

You can subscribe to receive an email or a webhook when API keys are expiring and when they have expired:

api_key.expiring	Occurs when an API key expires in seven days.
api_key.expired	Occurs when an API key has expired.
When you get a notification, rotate your API keys before they expire.

Once a key has expired, it's no longer valid and can't be revalidated. Create a new API key to rotate.

You can't update the expiry date of an existing API key. If you need to change the expiry date, you must create a new API key and revoke the old one.

Best practices
Your API key is a sensitive security credential. It gives you access to your Paddle account and can be used to make changes to your account. If bad actors gain access to your API key, it can harm your business.

Treat your API key like a password. Keep it safe and never share it with apps or people you don't trust.

For this reason, API keys can only ever be viewed once and must immediately be stored securely after creation. If you lose your API key, you must revoke it and create a new one.

You and your team are responsible for storing your API keys safely. Follow these best practices to help protect your API keys:

Always
Set an expiry date for your API keys.

Rotate your API keys regularly.

Use environment variables or credential management systems to store your API key.

Never
Share your API key in emails or chat.

Hardcode your API key in your code.

Include API keys in client-side code.

Store your API key in a public or accessible location.

Create an API key
Create in the dashboard
Go to Paddle > Developer Tools > Authentication.

Click the API keys tab.

Click New API key.

Illustration of the authentication screen in Paddle. It shows the API keys tab with a list of existing API keys. There's a button that says New API key in the top right.

Add preliminary details
Enter a name

This should be a human-readable name that you can use to uniquely identify this key.

Add a description

This should be a human-readable description of the API key that has details about what the API key is used for and where.

Illustration of the API key creation form. There's a field to enter the name and a field to enter the description.

Set an expiry date
Click the Expires on field.

Choose a date in the future. The default is 90 days from the date of creation if untouched.

Illustration of the expiry date section in the API key creation form. There's a field to enter the expiry date with a calendar icon to open a calendar to select a date.

Set permissions
Review the permissions reference guide to understand the permissions you need to assign to the API key.

Select only the permissions needed. Select All if your key needs either read or write access to all entities.

Illustration of the permissions section in the API key creation form. There's a list of permissions with a checkbox to select each.

Save the API key
Click Save when you're done.

The API key is created and displayed on the page. It's only visible once. Store it securely.

You're ready to use the API key to authenticate requests to the Paddle API.

Illustration of an open modal to copy the API key. There's instructions on saving and a button that says Copy.

Edit an API key
You can edit the name, description, and permissions assigned to an API key. You can't update:

Expiry dates

You must create a new API key with the desired expiry date and revoke the old one.

Expired keys

Once keys have expired, they're no longer valid and can't be revalidated. Create a new API key and rotate the old key.

Go to Paddle > Developer Tools > Authentication.

Click the API keys tab.

Click the ... action menu next to the API key you want to edit, then choose Edit.

Enter a new name and description for the API key.

Select and clear the permissions you want to assign and unassign from the API key.

Click Save when you're done.

Illustration of the authentication screen in Paddle. The three dots icon is open on the API key that is being edited. There's a button that says Edit key. A panel to edit the API key is on the right. It shows the name, description, and permissions fields.

Revoke an API key
You can revoke an API key at any time. You might do this when a key is expiring. We recommend rotating keys at regular intervals for your security.

Revoked API keys have a 60-minute grace period during which you can reactivate the key. After this time, the key is permanently revoked. You must create a new API key.

Go to Paddle > Developer Tools > Authentication.

Click the API keys tab.

Click the ... action menu next to the API key you want to revoke, then choose Revoke.

Confirm you want to revoke the API key by filling in the confirmation box.

Illustration of the revoke modal in Paddle. It shows the confirmation box with a field to confirm the action by typing in the name of the API key. There's a button that says Revoke.

Reactivate an API key
API keys have a 60-minute grace period to be reactivated after they're revoked. They can only be reactivated if they were revoked by a user and not by Paddle.

You can't reactivate an API key after this grace period has expired. You must create a new API key.

Legacy keys created before May 6, 2025 can't be reactivated. Create a new standard format API key.

Go to Paddle > Developer Tools > Authentication.

Click the API keys tab.

Click the ... action menu next to the API key you want to reactivate, then choose Reactivate.

Click Reactivate.

Illustration of the authentication screen in Paddle. It shows the API keys tab. There's a list of API keys with the three dots icon. The menu for the second token is open, highlighting the Reactivate option. There's a status for Recently revoked which gives information saying if there was a mistake, the user has an hour to reactivate the key.

Check API keys
Regularly check your API keys to monitor their lifecycle and security. This helps you identify which keys are active, expiring soon, or expired, as well as detect unexpected usage that could indicate potential security risks.

View API keys
Go to Paddle > Developer Tools > Authentication.

Click the API keys tab.

Illustration of the authentication screen in Paddle. It shows the API keys tab with a list of existing API keys. There's a button that says New API key in the top right.

Review the status
Identify the status of API keys to determine what actions, if any, you should take.

Active

The key is valid and can be used to authenticate requests. Audit where and when it's used.

Expiring soon

The key is approaching its expiry date. Plan to rotate it before it expires.

Expired

The key has expired past its expiry date. Replace it with a new key if you haven't already.

Illustration of the authentication screen in Paddle. It shows the API keys tab. There's a list of API keys with their status and last used date for each.

Check the last used date
For all keys that are active, check the Last used column to see when each key was last used. Look for:

Unexpected usage that could indicate a compromised key.

Inactive keys that may be candidates for rotation or removal.

Keys that were rotated recently to confirm they're no longer used.

If any of the above apply, rotate or revoke the keys.

Illustration of the authentication screen in Paddle. It shows the API keys tab. There's a list of API keys with their status and last used date for each.

Common errors
invalid_token	The API key you're trying to access isn't correct. Check that you have provided the correct API key, that it's in the correct environment, and that it hasn't been revoked.
forbidden	The API key you're trying to use doesn't have the required permissions to perform the requested action. Check that the API key has the necessary permissions.
Events
api_key.created	Occurs when an API key is created.
api_key.updated	Occurs when an API key is updated.
api_key.expiring	Occurs when an API key expires in seven days.
api_key.expired	Occurs when an API key has expired.
api_key.revoked	Occurs when an API key is revoked.
Related pages
Authentication
Read more
Permissions
Read more
Rotate API keys
Read more
On this page
Manage API keys
How it works
Sandbox vs live
Format
Permissions
Expiration
Best practices
Create an API key
Create in the dashboard
Add preliminary details
Set an expiry date
Set permissions
Save the API key
Edit an API key
Revoke an API key
Reactivate an API key
Check API keys
View API keys
Review the status
Check the last used date
Common errors
Events
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
Manage API keys - Paddle Developer