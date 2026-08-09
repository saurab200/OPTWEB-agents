/**
 * Minimal schema.org vocabulary slice needed to judge field completeness for
 * AI-visibility-relevant structured data. There is no reliable public API for
 * Google's Rich Results Test, so this is hand-built against schema.org's
 * published type hierarchy (https://schema.org/LocalBusiness, /Service,
 * /FAQPage, /Review, /AggregateRating) plus what LLM answer engines
 * (ChatGPT/Perplexity/Claude browsing) actually key off of: identity,
 * location, contactability, and trust signals.
 */

// schema.org/LocalBusiness and its common subtypes (partial but broad slice
// of the official hierarchy — https://schema.org/LocalBusiness "More specific
// Types" list, trimmed to types that actually show up on small-business sites).
export const LOCAL_BUSINESS_TYPES = new Set([
  "LocalBusiness",
  "Store",
  "Restaurant",
  "FoodEstablishment",
  "CafeOrCoffeeShop",
  "BarOrPub",
  "ProfessionalService",
  "MedicalBusiness",
  "MedicalClinic",
  "Dentist",
  "Physician",
  "LegalService",
  "Attorney",
  "AutomotiveBusiness",
  "AutoRepair",
  "HomeAndConstructionBusiness",
  "Electrician",
  "Plumber",
  "HVACBusiness",
  "RoofingContractor",
  "GeneralContractor",
  "HousePainter",
  "MovingCompany",
  "RealEstateAgent",
  "InsuranceAgency",
  "FinancialService",
  "AccountingService",
  "BeautySalon",
  "HairSalon",
  "NailSalon",
  "DaySpa",
  "GymOrFitnessCenter",
  "HealthClub",
  "VeterinaryCare",
  "ChildCare",
  "EducationalOrganization",
  "LodgingBusiness",
  "Hotel",
  "TravelAgency",
  "EntertainmentBusiness",
  "SportsActivityLocation",
  "DryCleaningOrLaundry",
  "SelfStorage",
]);

// Fields we expect a well-optimized LocalBusiness (or subtype) node to carry.
// These map to what an answer engine needs to confidently cite "who, where,
// when, how to reach."
export const LOCAL_BUSINESS_FIELDS = [
  "name",
  "address",
  "telephone",
  "openingHoursSpecification",
  "priceRange",
  "image",
  "url",
  "description",
  "geo",
] as const;

export const SERVICE_FIELDS = [
  "name",
  "serviceType",
  "provider",
  "areaServed",
  "description",
  "offers",
] as const;

export const REVIEW_AGGREGATE_FIELDS = [
  "ratingValue",
  "reviewCount",
  "bestRating",
  "itemReviewed",
] as const;

export const FAQ_PAGE_TYPE = "FAQPage";
export const QUESTION_TYPE = "Question";
