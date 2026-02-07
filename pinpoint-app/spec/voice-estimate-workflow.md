# Spec: Voice Estimate Workflow

## 1. Initial Contact
- Agent must ask: "Is this for a **new customer** or **one of your current ones**?"
- User response dictates the branch.

## 2. Existing Customer Branch
- User says: "Existing customer", "Someone in the system", or a specific name like "Keith".
- **Action**: Agent MUST call `lookup_customer(name)`.
- **Logic**:
  - **Single Match**: Pull Name, Address, Phone, and Email from the database record. Lock these into the estimate metadata. Do NOT ask the user for these fields if they already exist in the record.
  - **Multiple Matches**: Agent MUST read the names found and ask: "I found [Name A] and [Name B]. Which one should I use?"
  - **No Match**: Agent says: "I couldn't find a '[Name]' in the system. Should we create a new record for them, or try a different name?"

## 3. New Customer Branch
- User says: "New customer".
- **Action**: Agent collects:
  1. Full Name
  2. Property Address
  3. Phone Number
  4. Email (optional)
- **Metadata**: These are used to create a NEW customer record in the database upon estimate completion.

## 4. Field Extraction Rules
- **Do Not Guess**: If the customer is "Existing", the address and contact info MUST come from the database, not the transcript of the current call.
- **Confirmation**: After selecting a customer, the agent should briefly confirm: "Great, I've got [Name] at [Address]. What kind of project are we looking at today?"
