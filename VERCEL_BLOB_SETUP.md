# Setting Up Vercel Blob Storage

This application uses Vercel Blob Storage for storing presentation files. Follow these steps to set it up:

## 1. Install Dependencies

Make sure you have installed the required package:

```bash
npm install @vercel/blob
```

## 2. Configure Environment Variables

In your Vercel project, add the following environment variable:

- `BLOB_READ_WRITE_TOKEN`: A token that allows reading from and writing to your Blob store

## 3. Generate a Blob Token

To generate a Blob token:

1. Go to your Vercel dashboard
2. Select your project
3. Go to the "Storage" tab
4. Select "Blob"
5. Create a new token with read and write permissions
6. Copy the generated token

## 4. Add the Token to Your Environment

- For local development: Add the token to your `.env.local` file
- For production: Add the token in the Vercel project settings under "Environment Variables"

## 5. Database Schema Changes

Make sure your Supabase database has the following columns in the `presentation_groups` table:

- `file_url`: To store the URL of the uploaded presentation file
- `file_name`: To store the original filename of the uploaded presentation

If your database is using different column names (like `presentation_file_url`), you should either:

1. Rename the columns to match the new implementation, or
2. Update the code in `src/lib/storage.ts` to use your existing column names

## 6. Testing

After setting up, test the file upload functionality to make sure files are being stored in Vercel Blob and the URLs are correctly saved in your database.

## Troubleshooting

- If you get permission errors, verify that your `BLOB_READ_WRITE_TOKEN` is correct and has the right permissions.
- If uploads fail, check the browser console and server logs for more detailed error messages. 