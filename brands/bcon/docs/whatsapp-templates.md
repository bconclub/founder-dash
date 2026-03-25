# BCON WhatsApp Templates Reference

Last synced with Meta Business Manager: March 25, 2026

## Active Templates

### bcon_proxe_followup_engaged
- **Type:** Marketing | **Status:** Active - Quality pending
- **Params:** `customer_name`, `service_interest`
- **Buttons:** "Yes, let's go"
- **Body:**
  > Hi {{customer_name}}, we were talking about {{service_interest}} for your business. Let's continue where we left off?
- **Use case:** Follow-up for leads who previously engaged in conversation

### bcon_proxe_followup_noengage
- **Type:** Marketing | **Status:** Active - Quality pending
- **Params:** `customer_name`, `service_interest`
- **Buttons:** "Yes, tell me more" / "Just exploring"
- **Body:**
  > Hi {{customer_name}}, you reached out to us recently about {{service_interest}}. Would you like to know how we can help?
- **Use case:** Follow-up for leads who reached out but didn't engage further

### bcon_proxe_booking_reminder_24h
- **Type:** Marketing | **Status:** Active - Quality pending
- **Params:** `customer_name`, `booking_time`, `service_interest`
- **Buttons:** "Yes, I'll be there" / "No, I need to reschedule"
- **Body:**
  > Hi {{customer_name}}, your call with the BCON Team is tomorrow at {{booking_time}}.
  > We'll be going over {{service_interest}} for your business.
  > See you there.
- **Use case:** 24-hour booking reminder

### bcon_proxe_booking_reminder_30m
- **Type:** Marketing | **Status:** Active - Quality pending
- **Params:** `customer_name`, `service_interest`, `booking_time`
- **Buttons:** "I'm ready!"
- **Body:**
  > Hi {{customer_name}}, 30 minutes to go. Your call with the BCON Team for {{service_interest}} is at {{booking_time}}.
  > We are getting things ready for you
- **Use case:** 30-minute booking reminder

### bcon_proxe_reengagement_engaged
- **Type:** Marketing | **Status:** Active - Quality pending
- **Params:** `customer_name`, `pain_point`
- **Buttons:** "Yes, let's talk"
- **Body:**
  > Hi {{customer_name}}, you mentioned {{pain_point}} was a challenge. If that's still the case, we should chat.
  > We've been solving exactly that lately.
- **Use case:** Re-engagement for leads who previously engaged and shared a pain point

### bcon_proxe_reengagement_noengage
- **Type:** Marketing | **Status:** Active - Quality pending
- **Params:** `customer_name`
- **Buttons:** "Yes Lets Talk"
- **Body:**
  > Hi {{customer_name}}, we connected a while back but didn't get to dig in to details.
  > Want to see how we build systems that help businesses like yours grow?
- **Use case:** Re-engagement for leads who never engaged

## Not Yet Submitted to Meta

### bcon_proxe_first_outreach
- **Params:** `customer_name`
- **Use case:** Initial outreach for new leads from ads/forms

### bcon_proxe_post_call_followup
- **Params:** `customer_name`
- **Use case:** Follow-up after a completed call

### bcon_proxe_rnr
- **Params:** `customer_name`
- **Use case:** Rang no response follow-up

## Parameter Map

| Template | Param Count | Parameters |
|---|---|---|
| followup_engaged | 2 | customer_name, service_interest |
| followup_noengage | 2 | customer_name, service_interest |
| booking_reminder_24h | 3 | customer_name, booking_time, service_interest |
| booking_reminder_30m | 3 | customer_name, service_interest, booking_time |
| reengagement_engaged | 2 | customer_name, pain_point |
| reengagement_noengage | 1 | customer_name |

## Rules

- ALL outbound messages outside the 24h WhatsApp window MUST use an approved template
- Free-form messages only work within 24h of customer's last message
- Every template send must save `template_name` in conversation metadata
- Bad names (underscores, all caps handles, "Unknown") must be replaced with "there"
