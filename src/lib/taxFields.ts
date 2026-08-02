// Country-aware tax ID field labels, shared between vendor and buyer
// "Tax & Compliance" UI (vendor: ManageListings.tsx step 8; buyer: BuyerTaxPage.tsx).
export function getTaxFieldLabels(country: string) {
  if (country === 'United Kingdom') {
    return { primaryLabel: 'VAT Number', secondaryLabel: 'UTR (Unique Taxpayer Reference)', showSecondary: true };
  }
  if (country === 'United States') {
    return { primaryLabel: 'EIN (Employer Identification Number)', secondaryLabel: '', showSecondary: false };
  }
  if (country === 'India') {
    return { primaryLabel: 'PAN Number', secondaryLabel: 'GST Number', showSecondary: true };
  }
  return { primaryLabel: 'Tax ID', secondaryLabel: 'Additional Tax Reference (optional)', showSecondary: true };
}
