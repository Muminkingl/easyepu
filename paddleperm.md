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
Permissions
Permissions
Limit an API key's access to specific entities and actions in Paddle.

Permissions control what API keys can do. They help you keep data secure by limiting each key to only the access it needs. You can create different keys with tailored permissions for different users, teams, or systems. This acts as a guardrail, preventing unauthorized access to your entire account.

When creating or updating an API key, you can assign it specific permissions.

Permissions are scoped to specific entities in Paddle, such as products, customers, or transactions. You can select two types of permission to determine what the key can do with an entity:

Read - Entity (Read) or {entity}.read

Read, list, and use the include parameter to include the entity in a response. Works for GET requests and preview requests (using POST or PATCH).

Write - Entity (Write) or {entity}.write

Create, update, archive, and delete the entity. Works for POST, PATCH, and DELETE requests. Having write permission for an entity automatically includes read permission for that entity.

Select the correct permissions
The permissions a key needs depend on the operation being performed and what entities it's accessing.

Permissions required
You do need permissions when working with:

Operations that access entities

For operations that return or take action on an entity, your API key needs permission for that entity.

Example: Listing adjustments requires the adjustment.read permission.

Responses enriched with entities

When using the include parameter to enrich a response, your API key needs permission for any included entities.

Example: Listing prices with include=product requires both price.read and product.read permissions.

Entities that return customer portal URLs

When a response can include authenticated URLs linking to the customer portal, your API key needs the customer_portal_session.write permission or they are not returned.

Example: Without the customer_portal_session.write permission, listing subscriptions doesn't return the management_urls object containing authenticated links.

Entities to populate in simulated webhooks

When providing an entity ID in config.entities, your API key needs permission to read that entity and any related entities included in webhook payloads but not nested in the parent. For the entity you're attempting to populate, the request fails without the read permission. For related entities, static examples are used if the key has no read permissions.

Example: Creating a notification simulation with config.entities.subscription_id requires the subscription.read permission or the request fails. Without the transaction.read permission, related transactions will fall back to static examples in simulated payloads. Transactions aren't nested in subscriptions by default.

Permissions not required
You don't need permissions when working with:

Nested entities in responses

When an operation returns different entities within the primary entity's response, these nested entities are included even without specific permissions for them.

Example: A transaction response contains prices in the items array. These are included even if you only have transaction.read permission and not price.read.

Indirectly created or updated entities

Operations that indirectly create or update entities don't require additional write permissions for those generated entities.

Example: Creating an adjustment that updates a transaction only requires adjustment.write, not transaction.write.

Parent entities

If an entity has a parent entity, it isn't a prerequisite that the permissions for the parent entities are needed.

Example: Retrieving an address for a customer uses both address and customer path parameters, but only requires address.read, not customer.read.

Requests made with API keys that don't have the required permissions return a forbidden error (403).

Available permissions
Entity	Permission	Operations
Products	product.read	
List products
Get a product
Use product in include
product.write	
Create a product
Update a product
Prices	price.read	
List prices
Get a price
Use price in include
price.write	
Create a price
Update a price
Discounts	discount.read	
List discounts
Get a discount
Use discount in include
Configure simulated webhooks with existing discounts
discount.write	
Create a discount
Update a discount
Customers	customer.read	
List customers
Get a customer
List credit balances for a customer
Use customer in include
Configure simulated webhooks with existing customers
customer.write	
Create a customer
Update a customer
Addresses	address.read	
List addresses for a customer
Get an address for a customer
Use address in include
Configure simulated webhooks with existing addresses
address.write	
Create an address for a customer
Update an address for a customer
Businesses	business.read	
List businesses for a customer
Get a business for a customer
Use business in include
Configure simulated webhooks with existing businesses
business.write	
Create a business for a customer
Update a business for a customer
Payment methods	payment_method.read	
List payment methods for a customer
Get a payment method for a customer
Configure simulated webhooks with existing payment methods
payment_method.write	
Delete a payment method for a customer
Customer authentication tokens	customer_auth_token.write	
Generate an authentication token for a customer
Customer portal sessions	customer_portal_session.write	
Create a customer portal session
Return management_urls in subscription responses
Transactions	transaction.read	
List transactions
Get a transaction
Get a PDF invoice for a transaction
Preview a transaction
Use next_transaction or recurring_transaction_details in include
Configure simulated webhooks with existing transactions
transaction.write	
Create a transaction
Update a transaction
Revise a billed or completed transaction
Retry payment for a subscription transaction
Get a transaction to update payment method
Subscriptions	subscription.read	
List subscriptions
Get a subscription
Preview a one-time charge for a subscription
Preview an update to a subscription
Configure simulated webhooks with existing subscriptions
subscription.write	
Create a one-time charge for a subscription
Update a subscription
Activate a trialing subscription
Pause a subscription
Resume a paused subscription
Cancel a subscription
Adjustments	adjustment.read	
List adjustments
Get a PDF credit note for an adjustment
Use adjustment or adjustment_totals in include
adjustment.write	
Create an adjustment
Pricing preview	transaction.read	
Preview prices
Reports	report.read	
List reports
Get a report
Get a CSV file for a report
report.write	
Create a report
Events	notification.read	
List events
Use events in include
Notification settings	notification_setting.read	
List notification settings
Get a notification setting
notification_setting.write	
Create a notification setting
Update a notification setting
Delete a notification setting
Notifications	notification.read	
List notifications
Get a notification
notification.write	
Replay a notification
Notification logs	notification.read	
List logs for a notification
Simulations	notification_simulation.read	
List simulations
Get a simulation
notification_simulation.write	
Create a simulation
Update a simulation
Simulation runs	notification_simulation.read	
List runs for a simulation
Get a run for a simulation
notification_simulation.write	
Create a run for a simulation
Simulation run events	notification_simulation.read	
List events for a simulation run
Get an event for a simulation run
notification_simulation.write	
Replay an event for a simulation run
Client-side tokens	client_tokens.read	
Allow third-party integrations to view client-side tokens
client_tokens.write	
Allow third party integrations to create client-side tokens
Related pages
Manage API keys
Read more
Create API keys
Read more
Authentication
Read more
On this page
Permissions
Select the correct permissions
Permissions required
Permissions not required
Available permissions
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
Permissions - Paddle Developer