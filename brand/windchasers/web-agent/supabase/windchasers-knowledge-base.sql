-- ============================================================================
-- Windchasers Knowledge Base Data
-- Insert aviation training content for AI chat responses
-- Brand: windchasers
-- 
-- MANUAL ENTRY WORKFLOW (Like PROXe):
-- 1. Admin adds entries directly in Supabase dashboard
-- 2. Fill in: question, answer, category, subcategory, content, keywords
-- 3. Entry is immediately searchable via enhanced full-text search
-- 4. Use the search_knowledge_base() function for ranked results
-- ============================================================================

-- Ensure knowledge_base table exists (create if needed)
-- Note: Migration 023_enhance_knowledge_base.sql adds question, answer, subcategory columns
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL CHECK (brand = 'windchasers'),
    content TEXT NOT NULL,
    category TEXT,
    subcategory TEXT, -- Added in migration 023
    question TEXT, -- Added in migration 023 - the question users might ask
    answer TEXT, -- Added in migration 023 - the answer to provide
    keywords TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_knowledge_base_brand ON knowledge_base(brand);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_subcategory ON knowledge_base(subcategory);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_keywords ON knowledge_base USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content ON knowledge_base USING GIN(to_tsvector('english', content));
-- Enhanced full-text search index (created in migration 023)
-- CREATE INDEX IF NOT EXISTS idx_knowledge_base_fulltext ON knowledge_base USING GIN(to_tsvector('english', coalesce(question, '') || ' ' || coalesce(answer, '') || ' ' || coalesce(content, '')));

-- ============================================================================
-- PROGRAMS: DGCA Ground Classes
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'WindChasers offers DGCA Ground Classes covering all 6 subjects required for pilot licensing in India. The course includes Air Navigation (6-8 weeks), Air Regulations (3-4 weeks), Aviation Meteorology (4-5 weeks), Technical General (6-8 weeks), Technical Specific (5-6 weeks), and RTR Radiotelephony (2-3 weeks). We offer two packages: 4 subjects for ₹2.35 lakhs (3-4 months duration) and complete 6 subjects for ₹2.75 lakhs (4-5 months duration). Both packages include CFI and experienced instructors, in-depth curriculum, textbooks, WindChasers study materials, mock exams, assignments, flying school guidance, counseling support, and uniform. Classes available offline and online. Registration fee ₹20,000 (non-refundable, valid 1 month). Location: Kothanur, New Airport Road, Bangalore. GST 18% additional. No refunds on paid installments. Exam fees borne by student. 95% pass rate.', 
'programs', 
ARRAY['dgca', 'ground classes', 'pilot training', 'air navigation', 'meteorology', 'regulations', 'technical', 'rtr', 'radiotelephony', 'bangalore', 'cfi instructors', '6 subjects', 'dgca exam', 'pilot course'], 
'{"source": "dgca_page", "investment": "2.35-2.75L", "timeline": "3-5mo", "location": "Bangalore", "pass_rate": "95%"}',
'DGCA Ground Classes',
'Complete DGCA ground school training with 4 or 6 subject packages');

-- ============================================================================
-- PROGRAMS: Helicopter Training
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'WindChasers provides Helicopter Pilot License training in India. India is adding helicopters faster than creating pilots, creating massive demand in emergency medical services, offshore oil and gas, tourism and charter, disaster management, and state aviation wings. Training includes ground school, flight training, and license issuance. Career opportunities include offshore operations, medical evacuation, VIP transport, tourism, agriculture, and utility services. This is a skills shortage market, not an airline queue. Helicopter pilots are built, not mass-produced. Every hour you fly increases your demand. Wind Chasers is India''s only dedicated helicopter career promoter focused on rotary wing training.', 
'programs', 
ARRAY['helicopter', 'rotary wing', 'helicopter license', 'private helicopter', 'commercial helicopter', 'pilot shortage', 'ems', 'offshore', 'tourism', 'medical evacuation', 'helicopter jobs', 'helicopter demand'], 
'{"source": "helicopter_page", "demand": "high", "market_type": "skills_shortage", "career_opportunities": "multiple"}',
'Helicopter Pilot Training',
'Rotary wing training for high-demand helicopter careers');

-- ============================================================================
-- PROGRAMS: International Flight Training
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'WindChasers partners with flight schools in USA, Canada, New Zealand, South Africa, Hungary, and Thailand for international pilot training. This program is for students who have completed DGCA ground classes and are ready for flight training abroad. Prerequisites include DGCA Computer Number, Class 1 Medical Certificate, completed DGCA Ground Classes (6 subjects), and valid passport. We provide comprehensive support including personalized aviation counseling, visa assistance with 90% approval rate, loan assistance for education at low interest rates, and ongoing student guidance throughout training. International training offers exposure to different aviation standards, modern aircraft, and global career opportunities.', 
'international', 
ARRAY['fly abroad', 'international training', 'usa flight school', 'canada pilot', 'new zealand', 'south africa', 'hungary', 'dgca completed', 'overseas training', 'visa assistance', 'flight school abroad', 'international partnership'], 
'{"source": "international_page", "countries": "USA,Canada,NZ,SA,Hungary,Thailand", "prerequisites": "DGCA_completed", "visa_approval": "90%"}',
'International Flight Training',
'Overseas pilot training with visa and loan assistance');

-- ============================================================================
-- COSTS: Complete Breakdown
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'Complete pilot training costs in India range from ₹40-75 lakhs for all training programs. DGCA Ground Classes cost ₹2.35 lakhs (4 subjects) or ₹2.75 lakhs (6 subjects complete) plus 18% GST. Registration fee is ₹20,000 non-refundable. Flight training costs vary by country and program. Total timeline is 18-24 months from start to CPL completion. WindChasers provides transparent pricing with no hidden costs. All costs are disclosed upfront before enrollment. Payment methods include RTGS, NEFT, UPI, and Cash. Education loan assistance available. Examination fees are borne by the student separately.', 
'costs', 
ARRAY['pilot training cost', 'how much', 'fees', 'investment', 'price', 'budget', 'lakhs', 'expensive', 'affordable', 'payment', 'loan', 'dgca fees', 'flight school cost', 'total cost'], 
'{"source": "pricing", "investment": "40-75L", "timeline": "18-24mo", "payment_options": "RTGS,NEFT,UPI,Cash", "transparent": true}',
'Complete Pilot Training Costs',
'Transparent pricing breakdown for all training programs');

-- ============================================================================
-- COSTS: DGCA Specific Pricing
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'DGCA Ground Classes Pricing: Package 1 (4 Subjects) - ₹2.35 lakhs + GST, Duration 3-4 months, includes Air Navigation, Air Regulations, Aviation Meteorology, RTR. Package 2 (6 Subjects Complete) - ₹2.75 lakhs + GST, Duration 4-5 months, includes all 4 subjects plus Technical General and Technical Specific. Both packages include CFI instructors, in-depth curriculum, textbooks, comprehensive study materials, mock exams, assignments, flying school guidance, counseling support, and uniform. Registration fee ₹20,000 (non-refundable, valid for 1 month). GST 18% applicable. No refunds for paid installments. Exam fees separate.', 
'costs', 
ARRAY['dgca price', 'ground classes cost', 'dgca fees', '2.35 lakhs', '2.75 lakhs', '4 subjects', '6 subjects', 'registration fee', 'gst', 'package cost', 'course fee'], 
'{"source": "dgca_pricing", "4_subjects": "2.35L", "6_subjects": "2.75L", "registration": "20K", "gst": "18%", "duration_4": "3-4mo", "duration_6": "4-5mo"}',
'DGCA Ground Classes Pricing',
'Detailed pricing for 4 and 6 subject DGCA packages');

-- ============================================================================
-- TIMELINE: Training Duration
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'Pilot training timeline breakdown: DGCA Ground Classes take 3-5 months depending on package (4 or 6 subjects). Air Navigation takes 6-8 weeks, Air Regulations 3-4 weeks, Aviation Meteorology 4-5 weeks, Technical General 6-8 weeks, Technical Specific 5-6 weeks, RTR 2-3 weeks. After DGCA completion, flight training abroad takes 12-18 months. Total time from start to Commercial Pilot License is 18-24 months. DGCA exams must be completed within 3 years from first attempt. Students can attempt each subject multiple times with unlimited free revision at WindChasers until passing.', 
'timeline', 
ARRAY['how long', 'duration', 'time', 'months', 'years', 'training period', 'completion time', 'dgca duration', 'flight training time', 'when can i fly'], 
'{"source": "timeline", "dgca": "3-5mo", "total": "18-24mo", "exam_validity": "3yr", "free_revision": "unlimited"}',
'Pilot Training Timeline',
'Complete timeline from DGCA to CPL completion');

-- ============================================================================
-- ELIGIBILITY: Entry Requirements
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'To become a pilot in India, you need: 1) Complete 12th grade with Physics and Mathematics (bridge courses available if you don''t have these subjects). 2) Medical Certificate - Class 2 first, then Class 1 before flying. Medical fitness requirements include good vision (correctable), no color blindness, healthy cardiovascular system. 3) Minimum age 17 years for student pilot license. 4) DGCA Computer Number obtained through DGCA portal. 5) Valid passport for international training. Educational qualification: 10+2 with Physics and Math required. If you have Biology/Commerce/Arts, you need bridge courses. Currently pursuing 12th with PCM also eligible. Below 12th standard must complete education first.', 
'eligibility', 
ARRAY['requirements', 'eligibility', 'qualification', '12th', 'physics', 'maths', 'medical', 'age limit', 'can i become pilot', 'who can join', 'prerequisites', 'pcm', 'class 1 medical', 'minimum age'], 
'{"source": "eligibility", "education": "12th_PCM", "min_age": "17", "medical": "Class_1_required", "bridge_courses": "available"}',
'Pilot Training Eligibility',
'Complete eligibility requirements for pilot training');

-- ============================================================================
-- ABOUT: WindChasers Mission
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'WindChasers Aviation Academy is founded by Sumaiya Ali in Bangalore. Our mission: "Where Dreams Take Flight" - but with honesty and transparency. We position ourselves as an honest, transparent alternative to traditional flight schools that make false promises. Our tagline is "Real costs, real timelines, real guidance" because we believe in cleaning the aviation training industry through proper cost transparency and realistic expectations. We feature Certified Flight Instructors (CFI) including experienced airline pilots. WindChasers is not just a training provider but a comprehensive career partner supporting students from initial training through successful placement. We emphasize "No false promises, just honest conversations" about training costs and career realities. Located at Kothanur, New Airport Road, Bangalore. Contact: aviators@windchasers.in, +91 9591004043.', 
'about', 
ARRAY['windchasers', 'about us', 'sumaiya ali', 'founder', 'bangalore', 'mission', 'honest training', 'transparent', 'where dreams take flight', 'real costs', 'location', 'contact', 'who we are'], 
'{"source": "about", "founder": "Sumaiya Ali", "location": "Bangalore", "phone": "9591004043", "email": "aviators@windchasers.in", "tagline": "Real costs, real timelines, real guidance"}',
'About WindChasers',
'Honest and transparent aviation training academy');

-- ============================================================================
-- ABOUT: Why Choose WindChasers
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'Why Choose WindChasers for DGCA: 1) Classes by ATPL holders and airline-inducted pilots. 2) Instructors who simplify topics - understanding that every student learns differently. 3) Focus on skills and in-depth knowledge, not just passing exams. 4) Build strong aviation foundation from day one. 5) 1:1 doubt-clearing sessions with instructors. 6) Weekly mock tests plus past paper solving. 7) Free unlimited revision till you pass - no extra fee. 8) Personal performance tracking with regular feedback. 9) Supportive and respectful learning environment. 10) Guest lectures by airline captains and industry experts. 11) 95% pass rate. We offer experienced instructors, cutting-edge facilities, comprehensive training programs, industry recognition, personalized guidance, and global opportunities as consultants for overseas pilot training.', 
'about', 
ARRAY['why windchasers', 'advantages', 'benefits', 'pass rate', '95%', 'revision', 'mock tests', 'experienced instructors', 'airline pilots', 'atpl holders', 'doubt clearing', 'guest lectures'], 
'{"source": "advantages", "pass_rate": "95%", "free_revision": "unlimited", "instructors": "ATPL_holders"}',
'Why Choose WindChasers',
'11 reasons to choose WindChasers for DGCA training');

-- ============================================================================
-- WOMEN: Women in Aviation Focus
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'WindChasers is committed to empowering women in aviation. Currently, only 5% of pilots in India are women - we are working to change this statistic. We run special programs like "Exclusive Open House For Female Pilot Aspirants" to encourage more women to pursue aviation careers. WindChasers addresses the accessibility problem in pilot training for women through proper cost transparency and supportive learning environment. We believe in creating equal opportunities and breaking gender barriers in Indian aviation. Our female students receive the same rigorous training and support as male students, with additional focus on addressing unique challenges women face in entering this male-dominated field.', 
'women', 
ARRAY['women pilots', 'female pilots', 'girls', 'lady pilots', 'women in aviation', '5%', 'gender', 'female aspirants', 'diversity', 'women empowerment'], 
'{"source": "women_focus", "current_representation": "5%", "special_programs": "yes", "support": "dedicated"}',
'Women in Aviation',
'Supporting female pilot aspirants in India');

-- ============================================================================
-- INTERNATIONAL: Country-Specific Details
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'WindChasers International Flight Training Partners: USA - Modern training facilities, FAA certification standards, exposure to busy airspace. Canada - High-quality training environment, excellent aviation infrastructure. New Zealand - Scenic training locations, CASA certification, excellent weather conditions. South Africa - Cost-effective training, SACAA certification, year-round flying weather. Hungary - European aviation standards, EASA certification pathway. Thailand - Affordable Asian option. All programs require DGCA Ground Classes completion first. We provide visa assistance with 90% approval rate, meticulous paperwork preparation, education loan facilitation at low interest rates, and ongoing student guidance throughout international training journey.', 
'international', 
ARRAY['usa training', 'canada flight school', 'new zealand pilot', 'south africa', 'hungary', 'thailand', 'faa', 'easa', 'casa', 'sacaa', 'which country', 'best country', 'abroad training'], 
'{"source": "international_partners", "visa_approval": "90%", "countries": "6", "certifications": "FAA,EASA,CASA,SACAA"}',
'International Training Countries',
'Flight training partners across 6 countries');

-- ============================================================================
-- FINANCING: Education Loans & Payment
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'WindChasers provides comprehensive financial support for pilot training: 1) Education Loan Assistance - We facilitate faster access to educational loans at low interest rates. We understand funding importance in aviation training and help aspiring pilots overcome financial barriers. 2) Payment Plans - Registration fee ₹20,000 (non-refundable, valid 1 month). Balance can be paid in installments. No refunds for paid installments. 3) Payment Methods - RTGS, NEFT, UPI, Cash accepted. 4) Transparent Costing - All costs disclosed upfront, no hidden fees. We believe in honest conversations about the ₹40-75 lakhs investment required. Assessment includes financial readiness questions to help students understand their preparedness. We provide loan assistance service as part of our suite of services.', 
'financing', 
ARRAY['loan', 'education loan', 'emi', 'payment plan', 'installments', 'how to pay', 'financial help', 'funding', 'loan assistance', 'low interest', 'payment methods'], 
'{"source": "financing", "loan_assistance": "yes", "payment_methods": "RTGS,NEFT,UPI,Cash", "registration": "20K", "transparent": true}',
'Financing & Payment Options',
'Education loans and flexible payment plans');

-- ============================================================================
-- PROGRAMS: Pilot Assessment Test (PAT)
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'WindChasers Pilot Assessment Test (PAT) is a comprehensive 20-question aptitude test designed for pilot aspirants starting their journey (not for licensed pilots). Takes under 5 minutes to complete. Covers 3 sections: Section 1 - Qualification Score (50 points): Tests age, education status, Physics/Math percentages. Section 2 - Aptitude Score (50 points): Aviation IQ questions (ATC, forces, lift, DGCA, ailerons), Math calculations (distance, percentages, time conversion, angles), Communication skills (grammar, aviation terminology), Decision making under pressure. Section 3 - Readiness Score (50 points): Financial preparedness (₹40-75 lakhs understanding), Timeline planning (when to start), Career research depth. Total score out of 150 points with 4 tiers: 120-150 (Premium Lead - Ready to Start), 90-119 (Strong Candidate - Minor Prep Needed), 60-89 (Potential Candidate - Preparation Required), 0-59 (Not Ready Yet - Build Foundation First). Instant results with personalized guidance.', 
'programs', 
ARRAY['assessment', 'aptitude test', 'pat', 'pilot test', 'readiness test', 'am i ready', 'eligibility test', 'evaluation', 'aviation iq', 'pilot aptitude'], 
'{"source": "assessment", "questions": "20", "duration": "3-5min", "max_score": "150", "sections": "3"}',
'Pilot Assessment Test (PAT)',
'20-question aptitude test for pilot readiness');

-- ============================================================================
-- PROGRAMS: New Verticals - Drone Training
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'WindChasers is launching Drone Training programs (January 2026): 1) Drone Flying DGCA Certificate - 6 days duration, ₹35,000 per student, batch size 5-20 students. Includes DGCA certification for legal drone operations in India. 2) FPV Drone Training - 5 days duration, ₹50,000 per student, batch size 10-15 students. First-person view drone piloting skills. Both courses include comprehensive training materials and certification. This expands WindChasers beyond traditional pilot training into emerging aviation technology sectors.', 
'programs', 
ARRAY['drone', 'drone training', 'dgca drone', 'fpv drone', 'drone certificate', 'drone pilot', 'uav', 'unmanned aircraft', 'drone license', 'drone course'], 
'{"source": "drone_programs", "launch": "Jan_2026", "dgca_drone": "35K", "fpv_drone": "50K", "duration_dgca": "6days", "duration_fpv": "5days"}',
'Drone Training Programs',
'DGCA certified drone pilot training launching 2026');

-- ============================================================================
-- PROGRAMS: Industry Training Courses
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'WindChasers offers specialized Industry Training programs for aviation professionals and license holders: 1) Aviation English & Technical Communications (EALP) - 16 hours (2 days), ₹30,000 per student, batch 10-20. Essential for clear cockpit communication. 2) ATC Exam Prep (DGCA/AAI) - 16 hours (2 days), ₹30,000, batch 10-20. Preparation for Air Traffic Controller exams. 3) Airline Operations (OCC) - 16 hours (2 days), ₹25,000, batch 10-20. Operations Control Center training. 4) Aircraft Performance (Airline Level) - 16 hours (2 days), ₹40,000, batch 10-20. Advanced aircraft performance calculations. 5) FDM/FOQA + SMS - 16 hours (2 days), ₹30,000, batch 10-20. Flight Data Monitoring and Safety Management Systems. These courses prepare pilots for airline operations and help with career advancement.', 
'programs', 
ARRAY['industry training', 'aviation english', 'ealp', 'atc exam', 'airline operations', 'occ', 'aircraft performance', 'fdm', 'foqa', 'sms', 'professional development', 'airline preparation'], 
'{"source": "industry_courses", "duration": "2_days", "target": "professionals", "courses": "5"}',
'Industry Training Courses',
'Professional development for licensed pilots');

-- ============================================================================
-- PROGRAMS: License Upgrades
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'WindChasers offers License Upgrade programs for existing pilots: Type Rating - Specialized training for Boeing 737 and Airbus A320 aircraft. Required by airlines before pilots can fly specific aircraft types. Night Rating - Qualifications to safely navigate and operate aircraft after sunset. Opens opportunities for night flight services like aerial surveys, cargo transportation, emergency medical evacuation. Instrument Rating - Learn to navigate and control aircraft solely by reference to instruments regardless of weather conditions. Qualifies pilots for IFR operations in commercial aviation. Multi-Engine Rating - Master advanced aircraft with multiple engines. Qualifies for positions requiring multi-engine aircraft like corporate aviation, air taxi, cargo transport. These ratings significantly enhance pilot employability and career options.', 
'programs', 
ARRAY['type rating', 'night rating', 'instrument rating', 'multi engine', 'boeing 737', 'airbus a320', 'ifr', 'license upgrade', 'additional rating', 'pilot rating'], 
'{"source": "license_upgrades", "target": "licensed_pilots", "ratings": "4"}',
'License Upgrade Programs',
'Additional ratings for career advancement');

-- ============================================================================
-- PROGRAMS: Cabin Crew Training
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'WindChasers offers Cabin Crew Training programs for aspiring flight attendants. This vertical focuses on preparing students for cabin crew roles with airlines. Training includes safety procedures, customer service, emergency protocols, grooming standards, and airline operations. Part of WindChasers expansion into multiple aviation career paths beyond just pilot training. Provides pre-placement training to increase employability with airlines.', 
'programs', 
ARRAY['cabin crew', 'flight attendant', 'air hostess', 'cabin crew training', 'flight attendant course', 'airline cabin crew', 'cabin crew course'], 
'{"source": "cabin_crew", "career": "flight_attendant", "focus": "pre_placement"}',
'Cabin Crew Training',
'Flight attendant training for airline careers');

-- ============================================================================
-- PROCESS: 8 Steps to Become Pilot
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'8 Steps to Become a Pilot in India: Step 1 - Complete 12th Grade with Physics and Math (or take bridge courses if you don''t have these subjects). Step 2 - Get Medical Certificate (Class 2 first, then Class 1 before flying). Step 3 - Complete DGCA Ground Classes covering Navigation, Meteorology, Regulations, Technical subjects, RTR. Step 4 - Join Flight School for CPL training (Ground School + Flying hours). Step 5 - Complete 200 Flying Hours required for CPL license. Step 6 - Obtain Your Commercial Pilot License and apply for airline openings. Step 7 - Prepare for Airline Selection (written tests, simulator checks, interviews). Step 8 - Get Type Rating if required by airlines (Boeing 737 or Airbus A320). This journey typically takes 18-24 months from start to CPL.', 
'timeline', 
ARRAY['steps to pilot', 'how to become pilot', 'pilot journey', 'process', 'roadmap', '8 steps', 'cpl process', 'pilot career path', 'what to do'], 
'{"source": "pilot_journey", "steps": "8", "total_time": "18-24mo", "flying_hours": "200"}',
'8 Steps to Become a Pilot',
'Complete roadmap from education to CPL license');

-- ============================================================================
-- FAQ: DGCA Specific Questions
-- ============================================================================
INSERT INTO knowledge_base (brand, content, category, keywords, metadata, title, description) VALUES
('windchasers', 
'DGCA FAQs: Q: Do I need 12th pass to join DGCA classes? A: Yes, Physics and Math required. Bridge courses available if you don''t have them. Q: What''s difference between 3 and 5 subject packages? A: 4 subjects (₹2.35L) covers basic navigation, regulations, meteorology, RTR - good for helicopter pilots. 6 subjects (₹2.75L) is complete DGCA for airplane CPL including Technical General and Technical Specific. Q: Can I pay in installments? A: Yes, ₹20,000 registration (non-refundable), rest in installments. No refunds once paid. Q: What if I fail? A: Free unlimited revision until you pass, no extra fees. Q: How tough are exams? A: 6 papers, 100 marks each, need 70% to pass. Our pass rate is 95%. Q: When can I attempt exams? A: Complete papers within 3 years from first attempt. Q: Medical before DGCA? A: Class 2 medical recommended before starting. Class 1 needed before flying. Q: What after DGCA? A: Join flight school for CPL training (flying hours + license). Q: Online or offline? A: Both available. Offline recommended for complex subjects, online for flexibility. Q: Job guaranteed? A: No guarantees. We provide airline prep, resume help, interview training.', 
'eligibility', 
ARRAY['faq', 'questions', 'dgca questions', 'common questions', 'installments', 'pass rate', 'fail exam', 'job guarantee', 'medical requirement', 'online classes'], 
'{"source": "dgca_faq", "pass_rate": "95%", "exam_validity": "3yr", "passing_marks": "70%", "papers": "6"}',
'DGCA Frequently Asked Questions',
'Common questions about DGCA ground classes');

-- ============================================================================
-- Create trigger to update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_base_updated_at_trigger
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_base_updated_at();

-- ============================================================================
-- RLS Policies for knowledge_base
-- ============================================================================
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Anonymous users: Can SELECT (for chat widget)
CREATE POLICY "knowledge_base_anon_select" ON knowledge_base
    FOR SELECT
    TO anon
    USING (brand = 'windchasers');

-- Authenticated users: Full access
CREATE POLICY "knowledge_base_authenticated_all" ON knowledge_base
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Service role: Full access
CREATE POLICY "knowledge_base_service_role_all" ON knowledge_base
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT SELECT ON knowledge_base TO anon;
GRANT ALL ON knowledge_base TO authenticated;

-- ============================================================================
-- END OF KNOWLEDGE BASE DATA
-- ============================================================================
