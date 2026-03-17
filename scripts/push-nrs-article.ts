/**
 * Push NRS article to blog webhook as draft
 * Usage: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/push-nrs-article.ts
 */

const NRS_WEBHOOK_SECRET = process.env.BLOG_WEBHOOK_SECRET;
const NRS_BASE_URL = "https://painclinics.com";

const title =
  "Numeric Pain Rating Scale (NRS): How the 0-10 Pain Scale Works";

const html = `
<p>The <strong>Numeric Pain Rating Scale (NRS)</strong> is a standardized clinical tool that measures pain intensity on a <strong>0–10 scale</strong>. You select a whole number — <strong>0</strong> means no pain, <strong>10</strong> means the worst pain imaginable. Clinicians ask you to rate three experiences over the past 24 hours: your <strong>current pain</strong>, your <strong>lowest pain</strong>, and your <strong>worst pain</strong>. Those three numbers are averaged into a single score. A <strong>2-point reduction</strong> (or 30% decrease) represents clinically meaningful improvement. The entire assessment takes under one minute with no special equipment.</p>

<h2>What Is the Numeric Pain Rating Scale?</h2>

<p>The NRS is a segmented numeric version of the <a href="/blog/visual-analog-scale">Visual Analog Scale (VAS)</a> — but simpler to administer and score. Instead of marking a point on a continuous line, you choose a whole number from 0 to 10. Each number represents a distinct pain intensity level.</p>

<p>The scale measures <strong>pain intensity only</strong> — not pain quality, emotional impact, or functional limitation. It can be delivered <strong>verbally, by telephone, or on paper</strong>, making it one of the most versatile pain tools in clinical practice. No specialized training is required to administer it.</p>

<p>The NRS is used across hospitals, rehabilitation facilities, primary care offices, and emergency departments worldwide. It applies to adults managing <strong>chronic pain</strong>, post-surgical pain, rheumatic conditions, spinal cord injuries, and cancer-related pain. The scale can be administered either verbally or through a <a href="https://scireproject.com/outcome/numeric-pain-rating-scale-nprs/" target="_blank" rel="nofollow noopener">pen-and-paper format</a>, making it flexible across clinical settings.</p>

<h2>How Is the NRS Administered?</h2>

<p>Administration follows three steps and takes roughly <strong>one minute</strong>:</p>

<ol>
<li><strong>Rate your current pain</strong> — the intensity you feel right now</li>
<li><strong>Rate your best pain</strong> — the lowest level over the past 24 hours</li>
<li><strong>Rate your worst pain</strong> — the highest level over the past 24 hours</li>
</ol>

<p>Each rating uses the 0–10 scale. The clinician averages all three numbers to produce a single <strong>composite pain intensity score</strong> for the previous 24 hours. This averaging method reduces the impact of momentary spikes or dips and gives a more representative picture of your pain experience.</p>

<p>The NRS requires <a href="https://www.sralab.org/rehabilitation-measures/numeric-pain-rating-scale" target="_blank" rel="nofollow noopener">no formal training</a> to administer, which is one reason it has become the default pain assessment in most clinical environments.</p>

<h2>What Do NRS Pain Scores Mean?</h2>

<p>NRS scores divide into four clinical categories:</p>

<table>
<thead>
<tr><th>Score Range</th><th>Category</th><th>Clinical Meaning</th></tr>
</thead>
<tbody>
<tr><td><strong>0</strong></td><td>No pain</td><td>Baseline — used for tracking improvement over time</td></tr>
<tr><td><strong>1–3</strong></td><td>Mild</td><td>Pain is present but does not interfere with daily activities or require strong medication</td></tr>
<tr><td><strong>4–6</strong></td><td>Moderate</td><td>Pain disrupts tasks like cooking, working, or socializing — scores of 5–6 typically trigger treatment adjustments</td></tr>
<tr><td><strong>7–10</strong></td><td>Severe</td><td>Pain significantly impairs concentration and daily function — scores of 8–10 may require urgent intervention</td></tr>
</tbody>
</table>

<p>At the <strong>moderate cutoff of 4</strong>, the NRS shows <strong>63% sensitivity and 85% specificity</strong> for identifying clinically important pain. The <strong>minimum clinically important difference (MCID)</strong> is <strong>1.80 points or 36%</strong> — changes below this threshold do not reflect meaningful improvement in the patient's experience.</p>

<p>Importantly, even mild scores (1–3) can interfere with daily functioning in some patients. <a href="https://ebchelp.blueprint.ai/en/articles/8283762-pain-numeric-rating-scale-pnrs" target="_blank" rel="nofollow noopener">Chronic pain</a> can worsen conditions like depression and anxiety, meaning scores should always be considered alongside psychological wellbeing.</p>

<h2>How Reliable and Valid Is the NRS?</h2>

<p>The NRS performs strongly on both reliability and validity — the two measures that determine whether a clinical tool is worth using.</p>

<p><strong>Validity:</strong> The NRS correlates with the Visual Analog Scale at <strong>r = 0.941</strong> and the Verbal Rating Scale at <strong>r = 0.925</strong>. These high coefficients confirm the NRS captures pain intensity as accurately as more complex instruments.</p>

<p><strong>Test-retest reliability:</strong> When the same patient takes the NRS multiple times under similar conditions, scores remain consistent — with reliability coefficients reaching <strong>r = 0.96</strong> in rheumatoid arthritis patients.</p>

<p><strong>Patient usability:</strong> The NRS outperforms VAS in ease of use. Only <strong>15% of patients</strong> make errors when completing the NRS, compared to <strong>45% with VAS</strong>. Among cancer patients, <strong>63.8%</strong> preferred the NRS over VAS in <a href="https://ascopubs.org/doi/10.1200/JCO.2017.35.31_suppl.217" target="_blank" rel="nofollow noopener">direct comparison studies</a>.</p>

<p>Internal consistency across pain assessment tools that incorporate the NRS framework shows <a href="https://www.frontiersin.org/journals/pain-research/articles/10.3389/fpain.2024.1415635/full" target="_blank" rel="nofollow noopener">Cronbach's Alpha values</a> of 0.80–0.91, indicating good to excellent reliability.</p>

<h2>Which Clinical Settings Use the NRS?</h2>

<p>The NRS appears in virtually every clinical environment where pain is assessed:</p>

<ul>
<li><strong>Emergency departments</strong> — rapid verbal assessment for triage decisions, with strong correlation to other measures (<strong>r = 0.94</strong>)</li>
<li><strong>Chronic pain clinics</strong> — ongoing tracking for fibromyalgia, diabetic neuropathy, osteoarthritis, and <a href="/treatment-options">other pain conditions</a></li>
<li><strong>Physical therapy and rehabilitation</strong> — a 2-point reduction or 30% decrease is the accepted threshold for clinically meaningful progress</li>
<li><strong>Primary care</strong> — routine screening, where <strong>22% of visits</strong> involve pain as the primary complaint</li>
<li><strong>Geriatric and long-term care</strong> — self-reported scoring using interpretive bands (1–3 mild, 4–6 moderate, 7–10 severe)</li>
<li><strong>Pediatric settings</strong> — effective for children aged 8 and older, with younger patients typically assessed using the Wong-Baker FACES scale</li>
</ul>

<p>Electronic health record (EHR) integration allows continuous NRS tracking across visits, supporting both individual treatment decisions and large-scale pain research. The NRS demonstrates strong <a href="https://www.physio-pedia.com/Numeric_Pain_Rating_Scale" target="_blank" rel="nofollow noopener">construct validity</a> with VAS correlations of 0.86–0.95 across settings.</p>

<h2>What Are the Limitations of the NRS?</h2>

<p>The NRS answers one narrow question well: <em>how intense is your pain right now?</em> But that narrow focus creates real clinical blind spots.</p>

<p><strong>It misses the full pain experience.</strong> The NRS cannot capture pain quality, location, duration, emotional impact, or how pain disrupts sleep, mood, and daily activities. About <strong>56.7% of patients</strong> find the NRS insufficient as a standalone measure, and <strong>34.2%</strong> struggle to express their pain as a single number.</p>

<p><strong>The same score can mean different things.</strong> A score of 8 does not automatically mean unbearable pain — some patients scoring 8 or higher still describe their symptoms as tolerable. Patients with <a href="https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2016.01466/full" target="_blank" rel="nofollow noopener">high catastrophizing levels</a> report greater disability at the same NRS score compared to those with low catastrophizing. Culture, mood, fatigue, and expectations all influence how a patient selects their number.</p>

<p><strong>Zero is misleading for chronic pain.</strong> The 0 anchor implies complete pain elimination is achievable, which sets unrealistic expectations for patients living with persistent pain conditions.</p>

<p>For these reasons, best practice is to combine NRS scores with functional assessment tools like the <strong>Brief Pain Inventory</strong> or <strong>Oswestry Disability Index</strong> — and always pair the number with a clinical conversation about how pain affects the patient's life.</p>

<h2>How Does the NRS Compare to Other Pain Scales?</h2>

<p>The NRS sits within a family of pain intensity measures. Here is how it compares to the most common alternatives:</p>

<table>
<thead>
<tr><th>Scale</th><th>Format</th><th>Correlation with NRS</th><th>Best For</th></tr>
</thead>
<tbody>
<tr><td><strong><a href="/blog/visual-analog-scale">Visual Analog Scale (VAS)</a></strong></td><td>100mm continuous line</td><td>r = 0.86–0.95</td><td>Research settings requiring fine-grained measurement</td></tr>
<tr><td><strong>Verbal Rating Scale (VRS)</strong></td><td>Word categories (none/mild/moderate/severe)</td><td>r = 0.65–0.77</td><td>Patients who struggle with numeric abstraction</td></tr>
<tr><td><strong>Wong-Baker FACES</strong></td><td>Facial expression images</td><td>Moderate</td><td>Children under 8, patients with cognitive or language limitations</td></tr>
<tr><td><strong>Brief Pain Inventory (BPI)</strong></td><td>Multi-item questionnaire</td><td>Complementary</td><td>Measuring pain interference with daily function</td></tr>
</tbody>
</table>

<p>The NRS offers a practical advantage over VAS: it can be administered verbally (including by phone), requires no physical materials, and produces fewer patient errors. Among patients surveyed, <strong>52%</strong> chose the NRS as their preferred pain scale when given multiple options.</p>

<h2>Frequently Asked Questions</h2>

<h3>How long does the NRS take to complete?</h3>
<p>Under one minute. The single-item, verbal format makes it one of the fastest validated pain assessment tools available.</p>

<h3>Can the NRS be used over the phone?</h3>
<p>Yes. You verbally ask the patient to select a number from 0 to 10. Phone administration produces equivalent results to in-person paper or verbal formats.</p>

<h3>Can children use the NRS?</h3>
<p>Children aged 8 and older can use the NRS reliably. For younger children, visual tools like the Wong-Baker FACES scale are more appropriate due to the abstract nature of numeric rating.</p>

<h3>How often should pain be reassessed with the NRS?</h3>
<p>Every 4 hours during hospital stays, after each intervention or medication change, and at every outpatient visit. Increase frequency when treatment adjustments are underway or progress has stalled.</p>

<h3>Is the NRS available in other languages?</h3>
<p>Yes. The British Pain Society offers the NRS in 16+ languages, including Arabic, Hindi, Urdu, and Welsh, with right-to-left formatting where applicable. Free downloads are available on their website.</p>

<h3>Can patients with cognitive impairments use the NRS?</h3>
<p>Some cognitively impaired patients can use the NRS with assistance, but scores may be less consistent. For moderate to severe cognitive impairment, observational pain scales like PAINAD are more reliable alternatives.</p>
`;

async function pushNrsArticle() {
  const res = await fetch(
    `${NRS_BASE_URL}/api/webhooks/blog/${NRS_WEBHOOK_SECRET}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhook_name: "claude-code",
        title,
        html,
        markdown: "",
        image_base64: "",
      }),
    }
  );

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

pushNrsArticle();
