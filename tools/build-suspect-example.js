// Authored branching example. Run with Node to regenerate the importable JSON.
const fs = require('node:fs');
const path = require('node:path');
const {validateDialogueProject} = require('../js/exportCommon');
const choice = (text, reply, route) => ({text, reply, route});
const stage = (key, text, choices) => ({key, text, choices});

const daniel = [
stage('opening', 'Daniel: I run a theatre, Officer Ellis. Eighteen thousand six hundred pounds disappears and suddenly everyone remembers that I have debts. Is that what this is about?', [
 choice('Explain the purpose, confirm he can take a break, and invite an uninterrupted account.', 'Ellis: I want an accurate account, including anything that rules you out. The recording and interview safeguards have been explained. Tell me about the evening in your own words. Daniel: All right. I supervised the count, closed the office, then went outside.'),
 choice('Tell him financial trouble is a reason to ask questions, not proof of theft.', 'Daniel: Good. My debts are not a secret. I owe a contractor for work on my flat. I was outside when the money went missing. Ellis: We will check the timings rather than make assumptions.'),
 choice('Open with an accusation: his debts explain the theft.', 'Daniel: Then you have already decided. I want a break and to speak privately with my adviser. [Interview paused. No admission is obtained, and debt remains background information, not evidence of theft.]', 'pause')
]),
stage('account', 'Daniel: We finished counting at 20:35. Leah signed the deposit sheet and left around 20:40. I put the pouch in the office cabinet. At about nine I went to the loading bay for a cigarette. I stayed there until the alarm call.', [
 choice('Ask him to separate what he remembers from what he estimates.', 'Daniel: The count time is on the sheet. Nine is an estimate. I remember the interval bell. I cannot tell you exactly when I lit the cigarette. Ellis: I will record the loading-bay time as approximate.'),
 choice('Ask who could independently place him in the loading bay.', 'Daniel: A delivery driver saw me. White van, I think. I did not get his name. Ellis: We will check the delivery records; a possible witness is worth tracing.'),
 choice('Treat the estimate of nine oclock as an exact time.', 'Daniel: I said about nine. If you write down 21:00 as something I read off a clock, that would not be my statement. [The officer must clarify the original account.]', 'account')
]),
stage('access', 'Daniel: The cabinet opens with a staff PIN. I have one and Leah has one. Anyone could have watched someone enter it. There is no camera inside the office.', [
 choice('Ask him to describe the access system before showing the audit log.', 'Daniel: Six digits on the cabinet keypad. The display says accepted, then you turn the handle. The computer keeps a log. I do not know whether it records a failed attempt. Ellis: We will ask the installer about that.'),
 choice('Ask whether codes are individual and whether he has ever used Leahs.', 'Daniel: Individual, officially. Leah let me use hers once when mine stopped working. Months ago. I cannot remember it now. [This is recorded as a claim to test, not accepted as an established fact.]'),
 choice('Say that a PIN identifies the person who entered it.', 'Daniel: You just asked whether someone could copy it. A code is not a face. Ellis: You are right; the log alone cannot identify the user. Let us establish how access worked.', 'access')
]),
stage('timeline', 'Ellis: The cabinet log records Leahs credential at 21:06:14 and the alarm report at 21:11. Those are system times. Daniel: There you are. You should be interviewing Leah.', [
 choice('Ask whether he ever re-entered the office after going outside.', 'Daniel: No. Once I went to the bay, I stayed there. I did not go back along the office corridor. [The officer records this clear denial before introducing contrary evidence.]'),
 choice('Check the clock offsets before comparing the log with CCTV.', '[Technical check: the installer confirms the keypad clock was 42 seconds slow. The corrected cabinet event is 21:06:56. Corridor and exterior camera offsets are measured separately. Ellis records both raw and corrected times.]', 'timeline_checked'),
 choice('Conclude Leah took the money because her credential was logged.', '[The credential is a lead, not an identification. Daniel offers no new evidence. An interview ending here leaves the opportunity unresolved.]', 'inconclusive')
]),
stage('timeline_checked', 'Ellis: The clock comparison is complete. The corrected cabinet event is 21:06:56. Before we discuss the corridor footage, did you return inside? Daniel: No. I stayed in the bay.', [
 choice('Show the corridor clip and ask him to identify the person without suggesting an answer.', 'Daniel: That is me. I went in for my coat. I forgot that part. Ellis: The corrected time is 21:05:48. You have changed the account; tell me about that return.'),
 choice('Describe the clip accurately: it shows the corridor entrance, not the cabinet.', 'Daniel: Then it does not show me taking anything. Ellis: Correct. It does show you returning inside. Daniel: I went for my coat. I should have said that.'),
 choice('Claim the camera shows him opening the cabinet.', 'Daniel: There is no camera in that room. Are you saying you have footage or trying to get me to agree with you? [The officer corrects the overstatement and returns to the actual evidence.]', 'timeline_checked')
]),
stage('coat', 'Daniel: My coat was on the chair. I took it and went straight out. I did not touch the cabinet. Ellis: The corridor clip shows you entering without a bag and leaving carrying a folded dark coat.', [
 choice('Ask where the coat was and what route he took to reach it.', 'Daniel: On the chair by the desk, opposite the cabinet. I could reach it without going near the keypad. Ellis: Please sketch the route. [The sketch is retained with his account.]'),
 choice('Ask why he initially denied returning, without calling the explanation impossible.', 'Daniel: I was thinking about the cigarette, not collecting a coat. It was a short trip. Ellis: A corrected memory is possible. We still need to account for what happened during it.'),
 choice('Assert that a folded coat proves something was concealed inside it.', 'Daniel: Or it proves I was carrying a coat. Ellis: The footage cannot show its contents. [An unsupported inference would weaken the interview. Return to a checkable account.]', 'coat')
]),
stage('contents', 'Ellis: Describe the deposit as you last saw it. Start with the container, then anything attached to it. Daniel: A grey pouch. The count sheet was folded behind the clear window.', [
 choice('Ask what, if anything, was securing the pouch. Do not supply a colour.', 'Daniel: A red numbered seal. Not one of those orange cable ties. Ellis: You mentioned an orange tie. Tell me what you mean. [The orange replacement tie has not been mentioned in either interview or the press briefing.]'),
 choice('Ask who last handled the pouch during the count.', 'Daniel: Leah checked the sheet. I watched her put the red seal through the zip. I checked the number against the ledger. [The red seal was present at 20:35; later handling still needs to be examined.]', 'contents'),
 choice('Ask whether he remembers the orange cable tie.', '[The officer has supplied a non-public detail. Daniel merely agrees that an orange tie sounds familiar. His agreement can no longer demonstrate independent knowledge of that detail.]', 'contaminated')
]),
stage('knowledge', 'Daniel: You said there was an orange tie. Ellis: I asked what was securing the pouch. You supplied those words. We can replay that part. Daniel: Maybe someone backstage mentioned it.', [
 choice('Invite a source, time, and exact words for the claimed backstage conversation.', 'Daniel: I cannot name anyone. It might have been after the alarm. Ellis: We will check who had seen the cabinet. [The first scene photograph shows an orange tie on the empty pouch. Its colour was not included in the staff alert.]'),
 choice('Replay the exchange and offer him time to correct or explain it.', 'Daniel: I did say orange first. I heard people talking, but I cannot remember who. Ellis: I will record that explanation and check it. Knowing a detail is significant only if there is no innocent source.'),
 choice('Call the slip a confession and stop investigating.', '[Knowledge of a detail is not a confession. Daniel could have heard it from another person. Without checking possible sources, the interview remains inconclusive.]', 'inconclusive')
]),
stage('verification', '[Interview adjourned for checks, then resumed. The recording notes the break. Scene access records and staff accounts reveal no identified source for Daniels claimed conversation. The delivery driver saw Daniel at 20:54, then departed at 20:57; he cannot cover 21:06.] Daniel: That does not mean I stole anything.', [
 choice('Agree, then ask for the complete sequence inside the office.', 'Ellis: It does not prove theft by itself. It removes the drivers account as an alibi for the relevant minutes. What happened between entering the office and leaving with your coat? Daniel: I looked in the cabinet. Just looked.'),
 choice('Ask whether there is any other witness or record that could support his account.', 'Daniel: No one else saw me. Look, I did open it. I wanted to check the total, because I thought the count was wrong. I did not want that turned into something worse.'),
 choice('Say the driver watched the loading bay continuously.', 'Daniel: He drove away before the alarm. Ellis: That is correct. I must not describe his evidence more strongly than he does. [Return to the verified evidence.]', 'verification')
]),
stage('credential', 'Ellis: You now say you opened the cabinet. The only corrected access event during your return used Leahs credential. Daniel: Mine was unreliable. I used hers. I knew she would not mind.', [
 choice('Ask how he knew the code, and distinguish permission to open from permission to remove money.', 'Daniel: She wrote it on the handover pad when my code failed last month. No, she did not say I could take the deposit. Ellis: We will retain that distinction. Access permission would not establish permission to remove the money.'),
 choice('Compare this with his earlier statement that he could not remember her code.', 'Daniel: I remembered it all right. I did not want you thinking I used it that night. Ellis: What did you do after opening the cabinet? Daniel: I took the pouch out.'),
 choice('Tell him that using Leahs credential makes Leah an accomplice.', 'Daniel: She left before any of this. She did not know. [A shared or copied credential does not establish that its owner participated. Return to Daniels actions.]', 'credential')
]),
stage('admission', 'Daniel: I took the notes out. I was going to replace them on Monday. I put the empty pouch back and used a tie from the cable drawer. I panicked when the runner went to collect it.', [
 choice('Let him describe the act in his own words, without promising an outcome.', 'Daniel: It was my idea. I was short on the contractor payment. I knew which camera missed the inside of the room, but I forgot the corridor one. I wrapped the notes in my coat. Leah did not help me.'),
 choice('Ask what he meant by replace them and whether anyone authorised the removal.', 'Daniel: I thought I could put it back before the bank run. No one authorised it. I told myself it was borrowing. Ellis: I am recording your words, including the intended return, without treating that as permission.'),
 choice('Promise he can go home if he admits it.', 'Daniel: Are you offering a deal? [Ellis cannot promise an outcome. The interview is paused, the improper suggestion is recorded, and any further interview requires a fresh, fair approach.]', 'pause')
]),
stage('corroboration', 'Ellis: An admission still needs checking. Where are the notes now, and what could identify the package before anyone opens it? Daniel: Behind the removable bottom in my tool trolley, in the scene dock. Brown envelope, marked with the touring shows initials.', [
 choice('Record the location and description before a separate team checks them through proper procedures.', '[A separate team documents the recovery. The envelope is in the described compartment. The cash totals 18,600 pounds; a count band bears the counters initials. The orange ties in the cable drawer match the general type, not a unique forensic signature.]', 'resolution'),
 choice('Ask for the denominations, wrapping, and whether anyone else handled it before arranging recovery.', 'Daniel: Mostly twenties, four sealed bundles and loose notes. I used an old envelope marked NW. Nobody else handled it after me. [These details are recorded first; the recovery team independently finds the described package and amount.]', 'resolution'),
 choice('End the case on the admission without checking the money.', '[The recording contains an admission, but the location and amount have not been verified. Preserve the account and arrange the recovery; do not substitute an admission for the rest of the investigation.]', 'inconclusive')
]),
stage('contaminated', '[Interview review: the officer disclosed the orange tie. That detail cannot now be treated as knowledge volunteered by Daniel. The remaining evidence is the corrected timeline, his return to the office, and his changing account.] Daniel: You told me about the tie.', [
 choice('Acknowledge the disclosure and continue using independently verified timings.', 'Ellis: Yes. I will not use your agreement about the tie as independent evidence. We still need to account for your return to the office. Let us check the driver and your movements.', 'verification'),
 choice('Replay the recording and explicitly document the contamination.', '[The interview log records that the detail came from the officer. The investigation continues without relying on it. Smart questioning includes correcting mistakes rather than hiding them.]', 'verification'),
 choice('Continue to present the colour as secret knowledge only the offender could have.', '[The claim is contradicted by the recording. A reliable conclusion has not been reached. This route ends with an interview that needs review.]', 'inconclusive')
])
];

const leah = [
stage('opening', 'Leah: Everyone has heard that my PIN opened the cabinet. I signed for that money. I understand how this looks, but I did not take it.', [
 choice('Explain that a credential is evidence to investigate, not a finding of guilt.', 'Ellis: I want your account and anything that can check it. The recording and interview safeguards have been explained. You can ask for a break. Leah: Thank you. I have been trying to work out how to say this.'),
 choice('Ask her to start with the count and continue without interruption.', 'Leah: Daniel and I counted it together. I signed the sheet and sealed the pouch. Then I left. There is something about where I went that I did not tell my manager.'),
 choice('Say innocent people do not need time to work out an answer.', 'Leah: Then there is no answer you will believe. I want to stop and speak with my adviser. [The interview is paused. Hesitation has established nothing about involvement.]', 'pause')
]),
stage('count', 'Leah: The count was 18,600 pounds. Daniel read the totals; I added them independently. We signed at 20:35. I put the red seal on the pouch. Daniel said he would put it in the cabinet.', [
 choice('Ask what she personally saw, rather than what she assumed Daniel did afterward.', 'Leah: I saw him take the pouch towards the office. I did not watch him lock it in. I went to the cloakroom. Ellis: I will distinguish seeing the pouch leave from seeing the cabinet close.'),
 choice('Check whether the two counters could have made the same arithmetic error.', 'Leah: We both used the same denomination sheet, so yes, a mistake on it could affect both totals. The fundraising lead also photographed the bundles. You can compare the photograph, sheet, and ticket reconciliation.'),
 choice('Treat the signature as proof that she possessed the cash at 21:06.', 'Leah: I signed at 20:35. It does not say I still had it half an hour later. Ellis: That distinction matters. Let us establish what you actually witnessed.', 'count')
]),
stage('departure', 'Leah: I left through the public entrance at about 20:40. I told the duty manager I was going home. I know there is a camera over that door.', [
 choice('Ask how she travelled and what she remembers along the way.', 'Leah: My own car, from the north car park. I drove past the station and took the ring road. I did not go straight home. That part of my first account was wrong.'),
 choice('Invite her to correct the account now without suggesting a destination.', 'Leah: I went to the Linton Hotel. I did not want work to know. Before you ask, I was not meeting Daniel or anyone from the theatre.'),
 choice('Tell her the inaccurate destination proves the theft.', 'Leah: It proves I did not want to tell my boss where I was going. You still have to ask why. [Return to the destination before drawing a conclusion.]', 'departure')
]),
stage('private_meeting', 'Leah: I had a job interview in the hotel business lounge. With a touring company. The theatre is cutting hours and I have not told anyone I might leave.', [
 choice('Ask for details that can verify the meeting while keeping irrelevant personal matters out of the interview.', 'Leah: The operations director is Priya Shah. I can give you the company contact and invitation. I arrived early. The meeting ran until after nine fifteen. Please do not tell my manager more than you need to.'),
 choice('Ask why she concealed a lawful meeting from the initial inquiry.', 'Leah: The duty manager asked in front of everyone. I thought it was just about closing up. Then the cash disappeared and changing my account sounded worse. That was a bad decision, not an admission that I took money.'),
 choice('Insist on unrelated private messages as a test of whether she is cooperative.', 'Leah: You can check the invitation and speak to Priya. I want advice before discussing unrelated messages. [The officer narrows the inquiry to evidence relevant to the meeting.]', 'private_meeting')
]),
stage('anchors', 'Ellis: What fixes the meeting time? Leah: My calendar says 20:50, but that is the appointment time, not proof I arrived. I bought tea while I waited.', [
 choice('Separate planned times, remembered times, and records that can be independently checked.', 'Leah: The receipt may give the tea time. Priya arrived after me. There was a receptionist and a camera at the lounge entrance. My phone stayed in my handbag; its location would not prove I was with it.'),
 choice('Ask her to provide the original invitation and receipt for verification.', 'Leah: Here is the email thread, and the receipt is in my purse. Ellis: We will record how the material was obtained and ask the businesses to verify their own records rather than rely only on copies.'),
 choice('Accept the calendar screenshot as a complete alibi.', '[An appointment entry does not establish attendance. There is a plausible alternative account but no verified alibi yet. Further checks are needed.]', 'inconclusive')
]),
stage('opportunity', 'Ellis: The cabinet event was initially reported as 21:06:14. After checking the offset, it is 21:06:56. Leah: I was still in the meeting then. I do not know how to prove every minute.', [
 choice('Ask the hotel and interviewer to establish an interval rather than a single arrival time.', '[With the relevant material obtained through appropriate procedures, the hotel preserves footage. It shows Leah entering the lounge at corrected 20:47 and leaving at 21:18. No exit occurs in between. Priya confirms their continuous meeting in that interval.]'),
 choice('Check the full route and recording coverage, including any unobserved exits.', '[The investigator checks the lounge plan and the footage, not just two still images. Both exits are covered; there is no camera gap in the relevant interval. Priya independently describes the interview and its uninterrupted duration.]'),
 choice('Assume her card payment proves she personally stayed at the hotel.', 'Leah: I paid, but I understand someone could use a card. Ellis: Payment alone is not enough. We need evidence of your presence over the relevant interval.', 'opportunity')
]),
stage('travel', '[The hotel is 11 kilometres from the theatre. Available route records support a normal drive of at least 18 minutes that evening; travel time is supporting context, not the sole exclusion. The continuous meeting evidence covers the cabinet event.] Leah: So I could not have been in that office?', [
 choice('Explain that the continuous presence evidence excludes her as the person at the cabinet, while other questions still need checking.', 'Ellis: The verified interval places you at the hotel during the opening. We still need to understand how your credential was used and whether anyone had your permission. Leah: I never gave permission to take that money.'),
 choice('Check the clock verification and identity of the person in the footage before relying on the alibi.', '[Camera clocks are compared with a common time reference. Leah is identifiable in the recorded entry and exit, and Priya identifies her own interviewee. The independent sources agree within their documented timing tolerances.]'),
 choice('Reject the alibi because travel times can vary.', '[Travel estimates can vary, but they do not erase verified continuous presence elsewhere. The officer reviews the actual interval evidence instead of demanding impossible certainty about every road.]', 'travel')
]),
stage('pin', 'Leah: Daniel used my code last month. His keypad account had been disabled during a staff-system update. I wrote mine on the handover pad for him. I should not have done that.', [
 choice('Ask when this happened, who was told, and whether any record survives.', 'Leah: The update was on the third. I emailed facilities about his account that afternoon. The handover pad stayed in the office drawer. Facilities can check the account issue. I did not change my code afterward.'),
 choice('Ask exactly what she authorised when she shared the code.', 'Leah: Opening the cabinet to put the box-office float away that night. Nothing about this deposit. I never agreed that he could use my name or take money. Ellis: We will check the earlier circumstances separately.'),
 choice('Call the code-sharing an admission that she organised the theft.', 'Leah: It was poor security. It was not an agreement to steal. [A security breach creates an alternative explanation for the access log; it is not, by itself, evidence of an agreement.]', 'pin')
]),
stage('dispute', 'Ellis: A colleague heard you arguing with Daniel before the fundraiser. Leah: About unpaid overtime. He said the budget was exhausted. I said I would put the figures in writing.', [
 choice('Ask for the actual subject and check it against the written exchange.', '[The messages concern unpaid overtime and a request for a payroll correction. They contain no plan to remove the fundraiser deposit. Leah: Being angry with the manager did not make the charity money mine.'),
 choice('Ask whether the dispute changed any of her duties or access that evening.', 'Leah: No. He asked me to count because we always use two people. I did the count, signed, and left. Ellis: We will compare that with the rota and the other staff accounts.'),
 choice('Say anger and financial pressure outweigh the hotel evidence.', '[A possible motive cannot put Leah in a place where the reliable evidence says she was not. The officer must evaluate the dispute without discarding the alibi.]', 'dispute')
]),
stage('independence', '[Follow-up checks confirm the earlier account-reset ticket and Leahs facilities email. The interviewer was contacted through the companys published office contact, separately from Leah. Hotel records were supplied independently.] Leah: Is there anything else you need to check?', [
 choice('Ask whether anyone requested her code or help with the deposit that day.', 'Leah: No one asked that day. I did not send anyone to the office or arrange a collection. Ellis: The available communications and staff accounts show no contrary evidence. The old shared code explains access without requiring your presence.'),
 choice('Give her a chance to correct any remaining part of the account.', 'Leah: I said about 20:40 for leaving; your entrance footage says 20:41. Use the footage. And please record that I corrected the home story before you showed me hotel evidence. Ellis: Both points will be included.'),
 choice('Ask Priya to adopt the time in Leahs statement rather than give her own account.', '[Matching accounts are less useful if one witness has been fed the others recollection. Obtain Priyas independent account and original records instead.]', 'independence')
]),
stage('assessment', 'Ellis: Let me summarise. You concealed a job interview, but the meeting itself is independently verified. You were continuously away during the cabinet opening. Your credential had previously been shared, and there is no evidence you arranged this removal. Leah: That is what happened.', [
 choice('Test the strongest remaining alternative rather than ignoring it: could she have helped before leaving?', '[The independent treasurer checked the notes against the denomination sheet at corrected 20:58, after Leahs departure. Her signed reconciliation and photograph document the money, not just a closed pouch. She returned it to the cabinet with a fresh red seal. Checks find no evidence that Leah arranged its later removal.]'),
 choice('Ask a colleague to review both the incriminating and the clearing evidence.', '[A second investigator reviews the timing offsets, image continuity, original records, code-sharing history, and communications. The review agrees that the evidence clears Leah of involvement in this theft; it does not rely on her demeanour.]'),
 choice('Call her innocent simply because she seems relieved.', '[Relief is not evidence. The proper conclusion rests on verified records and the absence of support for the remaining theory, not how a person reacts in the interview.]', 'assessment')
]),
stage('closure', 'Leah: I understand why you asked. What happens to the suggestion that I stole from a charity? I still have to go back to work.', [
 choice('Record the exculpatory evidence and clearly tell her the inquiry no longer treats her as involved.', 'Ellis: The case record will include the evidence that clears you, not just the original PIN match. We will correct the factual position through the appropriate contact without sharing the unrelated details of your job interview.', 'resolution'),
 choice('Read back the corrected account and ask whether anything material has been missed.', 'Leah: Please include why I said home, and that I corrected it. Ellis: Both are recorded alongside the independent checks. Sharing a code was a security issue; the theft allegation is a separate matter.', 'resolution'),
 choice('Leave her under suspicion because admitting an error is uncomfortable.', '[The interview ends without a clear correction despite evidence excluding Leah. The review flags the unresolved communication and requires the officer to complete a fair closure.]', 'inconclusive')
])
];

// The officer speaks first on contact with either suspect.
daniel[0] = stage('opening', 'You begin talking with Daniel Voss.', [
 choice('Daniel, I am Officer Ellis. Could you take me through the evening, starting with the count?', 'Daniel: I supervised the count, closed the office, then went outside. I can give you the sequence, but some of the times will be approximate.'),
 choice('Before we discuss the missing money, is there anything about your movements that you want to clarify?', 'Daniel: I was in the loading bay when the alarm went up. I know people have mentioned my debts. I want you to check where I was, not just what I owe.'),
 choice('You were responsible for closing up. Who handled the deposit before you went outside?', 'Daniel: Leah counted with me and signed the sheet. I took the pouch to the office. Let me start at the count so we do not mix up the order.')
]);
leah[0] = stage('opening', 'You begin talking with Leah Mercer.', [
 choice('Leah, I am Officer Ellis. Could you describe your part in the count and what happened afterward?', 'Leah: Daniel and I counted together. I signed the sheet and sealed the pouch, then I left. I will tell you exactly what I saw.'),
 choice('What would help us check your account of the evening?', 'Leah: The count sheet and the entrance camera, for a start. There is also something about where I went that I need to correct. Please let me explain it properly.'),
 choice('Your credential appears in the cabinet log. Before drawing any conclusions, can we go through your evening?', 'Leah: Yes. I understand why you need to ask, but I did not take the money. Start with the count. There are records you can check.')
]);

const evidenceGate = stage('evidence_gate', 'Daniel: I have told you I opened the cabinet. That does not tell you when the money disappeared. What puts it there before I went back?', [
 {...choice('The treasurer verified the cash at 20:58. I have checked her signed sheet against the original photograph. What did you remove when you opened the cabinet?', 'Daniel: If you have checked that, then you know it was there. I took the pouch out. I need to explain what I thought I was doing.', 'admission'),
    conditions:[{variableName:'cabinetRecordChecked',comparisonOperator:'=',variableValue:1}]},
 choice('Let us keep the distinction clear. You accept opening it, but you have not explained what you did with the pouch?', 'Daniel: Correct. I opened it with the code. If you have a record showing the money was still there, check it before you tell me what it proves.', 'evidence_gate'),
 choice('I will pause here and inspect the treasurers verification packet before asking you to answer that.', 'Ellis: I will check the original photograph and signed denomination sheet at the evidence desk. We will resume from this question when that check is complete.', 'pause')
]);
daniel.splice(daniel.findIndex(s=>s.key==='admission'),0,evidenceGate);

const colleagueStages = [
stage('briefing','Morgan: What do you need before you start?',[
 choice('Give me the timeline and who we need to interview.', 'Morgan: Daniel Voss is the theatre manager; Leah Mercer helped count the deposit. The first count ended at 20:35 and the alarm came at 21:11. Leahs credential appears in the cabinet log. That gives us a lead, not the identity of the person who used it.', 'briefing'),
 choice('Which evidence should I be careful with?', 'Morgan: The cabinet clock was slow. Keep the original times and the documented corrections separate. Do not feed either suspect details you later want to test as independent knowledge. There is also a treasurers verification packet at the evidence desk.', 'evidence'),
 choice('Are both interviews ready to begin?', 'Morgan: Yes. Their advisers are present, the recording arrangements and safeguards have been explained, and welfare checks are complete. Start with your own question. Ask what they remember before presenting the records.', 'ready')
]),
stage('evidence','Morgan: The packet contains the original 20:58 photograph and the treasurers signed denomination sheet. A photograph of a closed pouch would not prove its contents. This check concerns the actual notes. What do you want clarified?',[
 choice('What am I checking when I inspect that packet?', 'Morgan: Check that the signed count, the photographed notes, and the documented time refer to the same verification. Establish what was present, when, and who checked it. Do not claim you have inspected the originals until you have.', 'evidence'),
 choice('When will that check matter in the interview?', 'Morgan: It matters later if Daniel accepts opening the cabinet but disputes whether the money was still inside beforehand. You can do most of the interview without it. The question relying on the verified packet must wait until you have inspected it.', 'briefing'),
 choice('Understood. I will check the packet before relying on it. Anything else before I begin?', 'Morgan: Keep the two accounts separate. A false statement about one subject does not make every other statement false, and clearing one person does not automatically prove the other took the money.', 'ready')
]),
stage('ready','Morgan: You can speak to either suspect first. Take the evidence in stages, and come back if you need the briefing again.',[
 choice('I will start with Daniel Voss.', 'Morgan: Daniel is ready. Give him a chance to explain his movements before testing the details.', 'finish'),
 choice('I will start with Leah Mercer.', 'Morgan: Leah is ready. Check both the access record and anything that could establish she was somewhere else.', 'finish'),
 choice('Before I go, remind me about the evidence packet.', 'Morgan: The packet is at the evidence desk. It is a separate inspection, not something this conversation can do for you.', 'evidence')
])
];

function buildCharacter(id, name, color, stages, intro, endings, x) {
    let nextId = 1;
    const nodes = [], keys = {}, stageChoices = {};
    const make = (type, text, px, py, key) => {
        const node = {dialogueID:nextId++,dialogueType:type,dialogueText:text,
            dialogueNodeX:px,dialogueNodeY:py,outgoingSockets:type==='question'?3:1,
            hideChildren:false,bgColor:type==='answer'?'#37536d':color,
            nodeElement:'',outgoingLines:[],nextNodeLineElem:'',nextNode:-1};
        nodes.push(node);if(key)keys[key]=node;return node;
    };
    const edge = (from, to, socket=0) => ({fromNode:from,fromSocket:socket,toNode:to,lineElem:'',transitionConditions:[]});
    const start = id === 3 ? make('line',intro,x+430,400,'intro') : null;
    stages.forEach((s,index)=>{
        const y=800+index*1000;
        const q=make('question',s.text,x+430,y,s.key);
        stageChoices[s.key]=s.choices.map((c,i)=>{
            const answer=make('answer','Officer Ellis: '+c.text,x+i*430,y+320);
            answer.siblings=3;answer.siblingNumber=i+1;
            const reply=make('line',c.reply,x+i*430,y+640);
            q.outgoingLines.push(edge(q.dialogueID,answer.dialogueID,i));
            answer.outgoingLines.push(edge(answer.dialogueID,reply.dialogueID));
            if (c.conditions) answer.outgoingLines[0].transitionConditions = c.conditions;
            return reply;
        });
    });
    Object.entries(endings).forEach(([key,text],i)=>make('line',text,x+i*430,900+stages.length*1000,key));
    if (start) start.outgoingLines.push(edge(start.dialogueID,keys[stages[0].key].dialogueID));
    stages.forEach((s,index)=>s.choices.forEach((c,i)=>{
        const key=c.route || stages[index+1]?.key || 'resolution';
        if(!keys[key])throw Error('Unknown route '+key);
        // Explicit Continue links let readers finish each response before moving on.
        const reply = stageChoices[s.key][i];
        reply.outgoingLines.push(edge(reply.dialogueID, keys[key].dialogueID));
    }));
    return {characterID:id,characterName:name,characterNodeX:x+430,characterNodeY:160,
        hideChildren:false,bgColor:color,nodeElement:'',outgoingLines:[edge(0,(start || keys[stages[0].key]).dialogueID)],dialogueNodes:nodes};
}

const project = {
    settings:{},
    title:'The Missing Benefit Deposit',
    description:'A fictional evidence-led interview case. Start with colleague Morgan, then question two suspects as Officer Ellis. Daniel has a late evidence condition controlled by the game. Bracketed passages later in the interviews are scene updates, not suspect speech.',
    caseNotes:{
        setting:'A fictional English-speaking city; procedures are deliberately not tied to a specific jurisdiction.',
        incident:'18,600 pounds from a benefit performance disappears from the North Wharf Theatre deposit cabinet.',
        facts:['Count completed at 20:35; Leah leaves at 20:41.',
            'The independent treasurer checks and photographs the notes at corrected 20:58, signs the reconciliation, and returns the pouch with a fresh red seal.',
            'Leah is independently placed in a continuous hotel interview from corrected 20:47 to 21:18.',
            'Driver sees Daniel at 20:54 and leaves at 20:57.',
            'Daniel returns along the office corridor at corrected 21:05:48.',
            'Cabinet event raw time 21:06:14; documented 42-second correction gives 21:06:56.',
            'Alarm report at 21:11; orange tie is documented in first scene photograph.',
            'The player must distinguish identity, opportunity, knowledge, motive, and corroboration.'],
        playInstructions:'Import this JSON with OPEN FILE. Start with colleague Morgan. Each suspect root opens directly on a short interaction caption with three Officer Ellis questions. Continue through replies when ready. The late verified-record question in Daniel requires cabinetRecordChecked = 1.',
        design:'The developer places Morgan at the initial briefing and scripts evidence-desk inspection to set numeric cabinetRecordChecked from 0 to 1. No dialogue node changes variables. Suspects can be interviewed in either order. A game can preserve the evidence checkpoint across a break or restart the interview. Editor Play mode uses its existing manual condition simulation; engine exports evaluate the variable.'
    },
    characters:[
        buildCharacter(1,'Daniel Voss - theatre manager','#704747',daniel,
            '[CASE BRIEF] You are Officer Ellis. The North Wharf Theatres benefit deposit of 18,600 pounds is missing. Daniel Voss managed the count and held cabinet access. Leah Mercer co-signed the count. An access log uses Leahs credential, but a credential does not establish identity. Interview each person separately and test both incriminating and clearing explanations.\n[INTERVIEW ONE] Daniel attends with an adviser. Recording, welfare checks, and applicable interview safeguards have been addressed. Interview breaks and evidence checks take place off screen. Your choices determine whether you obtain a reliable account.',
            {resolution:'[DANIEL: ACCOUNT CORROBORATED] Daniel admits removing the money without authority. His recorded description led independently to the concealed envelope and full amount. The corrected timeline, access history, recovery, and account support the finding that he took the deposit. The report includes his explanations, the limits of the CCTV, and any interview mistakes. Evidence is preserved for the next formal decision; this is not an instant conviction.\n[CASE CONTINUES] Interview Leah separately. Her PIN being used does not establish that she participated.',
             inconclusive:'[DANIEL: INQUIRY INCOMPLETE] Suspicion is not a completed case. Preserve the recording, identify the unsupported inference or missing check, and prepare a fair follow-up. Restart this interview to try an evidence-led route. You have not established Leahs involvement either.',
             pause:'[DANIEL: INTERVIEW PAUSED] Respect the request for a break and access to advice. Record the reason and do not treat the pause as evidence of guilt. This branch ends before a reliable conclusion. Restart when ready to explore another approach.'},160),
        buildCharacter(2,'Leah Mercer - events coordinator','#38645c',leah,
            '[CASE BRIEF] You are Officer Ellis, investigating the missing North Wharf Theatre benefit deposit. Leah Mercer co-signed the count. Her cabinet credential appears in the audit record. Daniel Voss was the manager on duty. Interview the two separately; do not assume the PIN owner is the person who used it.\n[INTERVIEW TWO] Leah attends with an adviser. Recording, welfare checks, and applicable safeguards have been addressed. She is anxious about her employer and initially concealed her destination. Your task is to check the account, not judge her expression or confidence.',
            {resolution:'[LEAH: CLEARED BY THE EVIDENCE] Independent records and an independently obtained witness account establish Leahs continuous presence at the hotel during the theft window. The pouch was still at the theatre after she left. The old code-sharing explains another persons access; the reviewed evidence shows no participation by Leah. Her inaccurate first destination concerned a private job interview, not the missing deposit. Record and communicate the clearing evidence.\n[CASE CONTINUES] If you have not interviewed Daniel, examine his account next. Clearing one suspect is not, by itself, proof against another.',
             inconclusive:'[LEAH: UNFINISHED ASSESSMENT] The interview has not reached a properly supported and communicated conclusion. Record what remains to be checked; do not retain suspicion merely because she lied about an unrelated matter. Restart to follow the independent evidence through to closure.',
             pause:'[LEAH: INTERVIEW PAUSED] The request for advice or a break is respected. No adverse inference is built into this example. Resume only through an appropriate process. Restart the interview to explore another approach.'},1900)
    ]
};
// Put the colleague first in the export cast and keep the three editor trees separate.
const leahCharacter = project.characters.find(c=>c.characterID===2);
leahCharacter.dialogueNodes = leahCharacter.dialogueNodes.filter(n=>!n.dialogueText.startsWith('[LEAH: INTERVIEW PAUSED]'));
for (const character of project.characters) {
    character.characterNodeX += 1740;
    for (const node of character.dialogueNodes) node.dialogueNodeX += 1740;
}
project.characters.unshift(buildCharacter(3,'Colleague Morgan','#405c85',colleagueStages,
    'Morgan: Ellis, we have a missing benefit deposit at the North Wharf Theatre: 18,600 pounds. You are interviewing two people who handled it, Daniel Voss and Leah Mercer. I will brief you before you speak to them. Keep an open mind; we need to test the records as well as their accounts.',
    {finish:'Morgan: I will be here if you need to go over the facts again. Speak to the suspects when you are ready, and inspect the evidence packet before relying on it in your final questions.'},160));
project.gameIntegration = {
    firstInteractionCharacterID:3,
    variables:{cabinetRecordChecked:{type:'number',initialValue:0,requiredValue:1,
        setBy:'Game developer: evidence-desk inspection of the original 20:58 photograph and signed denomination sheet. This dialogue does not set the variable.'}},
    evidenceCheckpoint:{characterID:1,dialogueID:project.characters.find(c=>c.characterID===1).dialogueNodes.find(n=>n.dialogueType==='question'&&n.dialogueText.startsWith('Daniel: I have told you I opened')).dialogueID}
};
// Keep apostrophes in prose while using simple single-quoted authoring strings above.
for (const character of project.characters) {
    for (const node of character.dialogueNodes) {
        for (const [plain, punctuated] of Object.entries({Leahs:"Leah's", Daniels:"Daniel's", drivers:"driver's", counters:"counter's", companys:"company's", Theatres:"Theatre's", shows:"show's", oclock:"o'clock", others:"other's", persons:"person's"})) {
            // Restrict replacements to the intended possessive phrases.
            const suffix = {drivers:' account',counters:' initials',shows:' initials',others:' recollection',persons:' access'}[plain] || '';
            node.dialogueText = node.dialogueText.replace(new RegExp('\\b'+plain+'\\b'+suffix, 'g'), punctuated+suffix);
        }
    }
}
require('./structure-example-speakers').structureExampleSpeakers(project);
require('./streamline-investigation').streamlineInvestigation(project);
require('./player-choice-only').playerChoiceOnly(project);
validateDialogueProject(project);
const output=path.join(__dirname,'../examples/two-suspects-investigation.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(project,null,2)+'\n');
console.log(output);
console.log(project.characters.map(c=>`${c.characterName}: ${c.dialogueNodes.length} nodes`).join('\n'));
module.exports=project;
