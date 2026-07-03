/** Bundled at build time so legal pages work on Cloudflare Workers (no runtime filesystem). */
import privacyPolicyMarkdown from "../../content/legal/privacy-policy.md";
import termsOfUseMarkdown from "../../content/legal/terms-of-use.md";

export { privacyPolicyMarkdown, termsOfUseMarkdown };
