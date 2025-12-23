  # Criteria for choosing the Clinics for Listing on Painclinics.com

  ## Ensure the clinics
  
  - Data richness (website, phone, images, etc.) adds value

  Let me look at what the top tier looks like with these constraints:

⏺ Bash(python3 -c "
      import csv…)
  ⎿  Clinics with >0 reviews: 384  

     Top 40 by review count:
     … +42 lines (ctrl+o to expand)

⏺ I see some issues - there are out-of-state clinics mixed in (Ohio, Nebraska, Utah, etc.). Let me filter strictly to Wyoming and check the geographic coverage:

⏺ Bash(python3 -c "
      import csv…)
  ⎿  Wyoming clinics with >0 reviews: 220

     Top 45 Wyoming clinics by reviews:
     … +47 lines (ctrl+o to expand)

⏺ Now I have a clearer picture. 220 Wyoming clinics with reviews. I have some questions to finalize the filtering criteria:
                                                                                                                        
⏺ User answered Claude's questions:
  ⎿  · Which clinic types should be included in the final list? → Pain-focused only
     · Should low-rated clinics (under 4.0 rating) be excluded even if they have many reviews? → No, reviews matter more
     · How important is geographic spread across Wyoming cities? → Somewhat

⏺ Let me apply those filters and see what pain-focused clinics we have:

⏺ Bash(python3 -c "
      import csv…)
  ⎿  Pain-focused Wyoming clinics with reviews: 40

     All pain-focused clinics:
     … +58 lines (ctrl+o to expand)

⏺ We have exactly 40 pain-focused Wyoming clinics. To get to ~35 "strong" ones, I can see that the bottom entries (1-2 reviews) are quite weak. Let me write up the plan:

⏺ Updated plan
  ⎿  /plan to preview

⏺ I notice some edge cases in my filtering. Let me verify:
                                                                                                                              
⏺ User answered Claude's questions:
  ⎿  · Some clinics have pain in their secondary categories but main category is Chiropractor or Orthopedic. Include these? → 
     Include if pain-related
     · What's the minimum review count to be considered 'strong'? → 10+ reviews

⏺ Let me verify the final list with 10+ reviews:

⏺ Bash(python3 -c "
      import csv…)
  ⎿  Final count (10+ reviews, pain-related): 23

     Final list:
     … +40 lines (ctrl+o to expand)

⏺ 23 clinics covering 12 Wyoming cities. Let me finalize the plan:

⏺ Updated plan
  ⎿  /plan to preview

⏺ Plan is ready. Here's the summary:

  Final Output: 23 strong Wyoming pain clinics
  - All have 10+ reviews (range: 10-661)
  - Covers 12 Wyoming cities
  - Includes Pain Care Centers (7 locations), orthopedic/chiro with pain focus
  - Preserves all original columns

  Ready to execute when you approve.

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Ready to code?

 Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Plan: Filter Wyoming Pain Clinics to Final List

 Summary

 Filter wyomic_clinics.csv (439 clinics) down to 23 "strong" pain-focused clinics and save as wyoming_clinics_final.csv.

 Filtering Criteria (confirmed with user)

 1. State: Wyoming only
 2. Category: Pain-related (include chiro/ortho if "pain" in their categories)
 3. Reviews: 10+ minimum
 4. Rating: No cutoff (reviews matter more)
 5. Geography: Somewhat important (achieve good spread)

 Final List: 23 Clinics

 | #   | Reviews | Rating | City         | Name                                  |
 |-----|---------|--------|--------------|---------------------------------------|
 | 1   | 661     | 4.8    | Laramie      | Premier Bone & Joint Centers          |
 | 2   | 427     | 4.9    | Casper       | Pain Care Centers                     |
 | 3   | 259     | 4.7    | Cheyenne     | Natalie B. Winter, MD                 |
 | 4   | 249     | 4.6    | Rock Springs | Pain Care Centers                     |
 | 5   | 219     | 5.0    | Casper       | Trevor P. Gessel, M.D.                |
 | 6   | 219     | 4.9    | Riverton     | HealthSource Chiropractic of Riverton |
 | 7   | 217     | 5.0    | Sheridan     | Atlas Chiropractic                    |
 | 8   | 208     | 4.7    | Cheyenne     | Pain Care Centers                     |
 | 9   | 173     | 4.9    | Lander       | Pain Care Centers                     |
 | 10  | 137     | 4.6    | Cheyenne     | Orthopedics & Surgical Specialists    |
 | 11  | 126     | 4.9    | Evanston     | Pain Care Centers                     |
 | 12  | 83      | 4.9    | Cheyenne     | William Denk, MD                      |
 | 13  | 66      | 4.8    | Cheyenne     | HealthFirst: Jonathan Singer, DO      |
 | 14  | 48      | 4.8    | Cody         | Prohealth Pain Relief & Wellness      |
 | 15  | 45      | 2.8    | Gillette     | Powder River Pain Clinic              |
 | 16  | 43      | 5.0    | Casper       | HealthSource Chiropractic of Casper   |
 | 17  | 39      | 3.6    | Rock Springs | Aspen Mountain Medical Center         |
 | 18  | 33      | 4.9    | Sheridan     | Pain Care Centers                     |
 | 19  | 17      | 4.9    | Afton        | Symbii Home Health and Hospice        |
 | 20  | 14      | 4.4    | Rock Springs | Brandon V. Mack, MD                   |
 | 21  | 13      | 4.8    | Jackson      | Pain Care Centers                     |
 | 22  | 11      | 5.0    | Laramie      | Aspen Creek Naturopathic Clinic       |
 | 23  | 10      | 4.2    | Cheyenne     | QC Kinetix (Cheyenne, WY)             |

 Geographic Coverage (12 cities)

 - Cheyenne: 6
 - Casper: 3
 - Rock Springs: 3
 - Laramie: 2
 - Sheridan: 2
 - Riverton, Lander, Evanston, Cody, Gillette, Afton, Jackson: 1 each

 Implementation Steps

 1. Read wyomic_clinics.csv
 2. Filter: detailed_address.state contains "Wyoming"
 3. Filter: main_category or categories contains "pain" OR "anesthesi" OR "physiatri"
 4. Filter: reviews >= 10
 5. Sort by reviews descending
 6. Write to public/wyoming_clinics_final.csv (preserve all columns)

