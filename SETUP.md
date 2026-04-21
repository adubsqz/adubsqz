# Setup Guide: Inquiry-to-Invoice Workflow

This guide explains how to set up the inquiry system for your photography portfolio.

## Environment Variables

1. **Get a Resend API Key**
   - Sign up at [resend.com](https://resend.com)
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)

2. **Configure Environment Variables in Vercel**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add the following variables:

   ```
   RESEND_API_KEY=re_your_api_key_here
   INQUIRY_RECIPIENT_EMAIL=adubsqz@gmail.com
   RESEND_FROM_EMAIL=inquiries@yourdomain.com
   ```

   **Gallery password gate (optional):** To show the password gate on the deployed site, add these two **server-side** vars (no `VITE_` prefix):

   ```
   GALLERY_PASSWORD=your_password_here
   GALLERY_AUTH_SECRET=<long_random_string>
   ```

   Generate `GALLERY_AUTH_SECRET` with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. The password is verified server-side by `/api/auth`, so **changing `GALLERY_PASSWORD` takes effect immediately — no redeploy required.** Leave `GALLERY_PASSWORD` unset to make the site fully public.

   **Note on RESEND_FROM_EMAIL:**
   - If you have a custom domain, use an email like `inquiries@yourdomain.com`
   - You'll need to verify the domain in Resend first
   - Alternatively, use Resend's test domain (check Resend dashboard for available domains)

3. **Verify Your Domain in Resend (Optional but Recommended)**
   - For production use, verify your domain in Resend
   - This allows you to send from your own domain
   - Follow Resend's domain verification guide

## Testing the Inquiry Flow

GitHub Actions CI does not need Resend secrets: unit tests mock email sending.

1. **Local Development**
   - Create a `.env.local` file in the project root
   - Add the environment variables (same as above)
   - Run `npm run dev`
   - Test the inquiry form by clicking "Request Invoice" on any photo

2. **Production**
   - Deploy to Vercel
   - Ensure environment variables are set in Vercel dashboard
   - Test the inquiry form on the live site

## How It Works

1. **User Flow:**
   - User views a photo in the lightbox
   - Clicks "Request Invoice" button
   - Fills out inquiry form (Name, Email, Company, Shipping Address, Print Size, Notes)
   - Submits the form

2. **Backend Flow:**
   - Form submission sends POST request to `/api/inquire`
   - Vercel Edge Function processes the request
   - Email is sent via Resend to your configured email address
   - User sees success message

3. **Your Workflow:**
   - Receive email notification with inquiry details
   - Review the request
   - Create invoice manually (via Zelle/Venmo)
   - Send invoice to the client's email address

## Troubleshooting

**Email not sending?**
- Check that `RESEND_API_KEY` is set correctly
- Verify `RESEND_FROM_EMAIL` is a verified domain/email in Resend
- Check Vercel function logs for errors

**API route not found?**
- Ensure the file is at `/api/inquire.ts` (not in `src/api`)
- Verify the file exports a default function
- Check Vercel deployment logs

**Form submission errors?**
- Open browser console to see error messages
- Check network tab for API response
- Verify all required fields are filled

## Customization

- **Email Template**: Edit the HTML template in `/api/inquire.ts`
- **Form Fields**: Modify `InquiryModal.tsx` to add/remove fields
- **Print Sizes**: Update the `PrintSize` type and select options in `InquiryModal.tsx`
