const DEFAULT_LOGO = "/branding/clinicamg-logo.png";
const DEFAULT_NAME = "Clínica Monte Grande";

export function getInstitutionBrand() {
  return {
    logoSrc:
      process.env.NEXT_PUBLIC_INSTITUTION_LOGO_URL?.trim() || DEFAULT_LOGO,
    logoAlt: process.env.NEXT_PUBLIC_INSTITUTION_NAME?.trim() || DEFAULT_NAME,
  };
}
