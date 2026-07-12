/**
 * Weekly rebuild cron — deploy as a separate Worker.
 * Schedule: 0 22 * * 1  (Mondays 06:00 AWST = Sunday 22:00 UTC)
 *
 * Env: DEPLOY_HOOK_URL = Cloudflare Pages deploy hook URL
 */
export default {
  async scheduled(_event: ScheduledEvent, env: { DEPLOY_HOOK_URL: string }, _ctx: ExecutionContext) {
    if (!env.DEPLOY_HOOK_URL) return;
    await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
  },
};
