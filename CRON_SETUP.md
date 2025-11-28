# Escrow Auto-Finalization Cron Job Setup

Phoenix Market uses a 24-hour escrow system that automatically releases funds to vendors after the timer expires. To enable this, you need to set up a cron job.

## Vercel Cron Jobs (Recommended)

1. **Add to `vercel.json`**:
\`\`\`json
{
  "crons": [
    {
      "path": "/api/cron/auto-finalize",
      "schedule": "0 * * * *"
    }
  ]
}
\`\`\`

This runs every hour and automatically finalizes any expired escrows.

2. **Deploy** - The cron job activates automatically on deployment

## Alternative: External Cron Service

If not using Vercel, set up a cron job that calls:
\`\`\`bash
curl https://your-domain.com/api/cron/auto-finalize
\`\`\`

Run this hourly: `0 * * * *`

## How It Works

- When a buyer purchases a product, funds are locked in escrow for 24 hours
- Buyer can release funds early or dispute the order
- After 24 hours, if no action is taken, the cron job automatically:
  - Credits the vendor's wallet (minus commission)
  - Marks the escrow as finalized
  - Updates the order status

## Testing

Test the auto-finalize endpoint manually:
\`\`\`bash
curl https://your-domain.com/api/cron/auto-finalize
