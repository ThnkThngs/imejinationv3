import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listPortfolio from "./tools/list-portfolio";
import updatePortfolioProject from "./tools/update-portfolio-project";
import listServices from "./tools/list-services";
import listLeads from "./tools/list-leads";
import updateLeadStatus from "./tools/update-lead-status";
import getHomepageContent from "./tools/get-homepage-content";

// The OAuth issuer must be the direct Supabase host; the project ref is inlined
// at build time and survives publish unchanged.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "imejination-mcp",
  title: "Imejination Studio",
  version: "0.1.0",
  instructions:
    "Tools for the Imejination photography and film studio site. Read and manage portfolio projects, services, homepage copy and client leads. Lead and admin data requires an admin account; the signed-in user's permissions always apply.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listPortfolio,
    updatePortfolioProject,
    listServices,
    listLeads,
    updateLeadStatus,
    getHomepageContent,
  ],
});
