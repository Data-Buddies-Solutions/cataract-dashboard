import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const today = new Date();
const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

function todayAt(hour: number, min: number) {
  return new Date(startOfDay.getTime() + hour * 3600000 + min * 60000);
}

function dob(yearsAgo: number, monthOffset = 0) {
  return new Date(today.getFullYear() - yearsAgo, today.getMonth() + monthOffset, 15);
}

async function main() {
  console.log("Seeding database...");

  // ── Patient 1: High propensity, unreviewed ──
  const p1 = await prisma.patient.upsert({
    where: { id: "seed-patient-1" },
    update: {},
    create: {
      id: "seed-patient-1",
      name: "Margaret Thompson",
      firstName: "Margaret",
      lastName: "Thompson",
      phone: "(555) 234-5678",
      email: "margaret.thompson@email.com",
      dateOfBirth: dob(72),
      appointmentDate: todayAt(9, 0),
      doctor: "Dr. Chen",
      callStatus: "called",
    },
  });

  await prisma.webhookEvent.upsert({
    where: { conversationId: "seed-conv-1" },
    update: {},
    create: {
      id: "seed-call-1",
      type: "post_call_transcription",
      eventTimestamp: Math.floor((todayAt(9, 0).getTime() - 5 * 86400000) / 1000),
      agentId: "agent_cataract_screening",
      conversationId: "seed-conv-1",
      status: "done",
      callSuccessful: true,
      callDurationSecs: 487,
      visionScale: 8,
      activities: "reading, gardening, driving, cooking, traveling",
      visionPreference: "Would love to not need glasses for anything",
      patientId: p1.id,
      data: {
        metadata: {
          call_duration_secs: 487,
          cost: 0.42,
          start_time_unix_secs: Math.floor((todayAt(9, 0).getTime() - 5 * 86400000) / 1000),
          charging: { llm_price: 0.31, call_charge: 0.42 },
        },
        analysis: {
          call_successful: true,
          transcript_summary:
            "Margaret is a 72-year-old retired teacher who is very motivated to improve her vision. She reports significant difficulty with reading, driving at night, and seeing her grandchildren's faces clearly. She expressed strong interest in premium lenses after learning they could reduce her dependence on glasses. She is ready to proceed with surgery and has already arranged for her daughter to drive her to the appointment.",
          data_collection_results: {
            patient_name: {
              value: '{"patient_name": "Margaret Thompson", "occupation": "Retired teacher"}',
              rationale: "Patient provided name and occupation",
              data_collection_id: "patient_name",
            },
            occupation_and_lifestyle: {
              value: "Retired teacher, very active — volunteers at the library, tends a large garden, watches grandchildren 3 days a week",
              rationale: "Patient described her daily routine",
              data_collection_id: "occupation_and_lifestyle",
            },
            vision_impact_scale: {
              value: "8",
              rationale: "Patient rated her vision impact as 8 out of 10",
              data_collection_id: "vision_impact_scale",
            },
            daily_activities_affected: {
              value: "Reading is very difficult — can't read to grandchildren anymore. Night driving is unsafe, had to stop driving after dark. Cooking requires holding recipes very close. Garden work is harder because she can't see weeds vs seedlings.",
              rationale: "Patient described multiple daily activities significantly affected",
              data_collection_id: "daily_activities_affected",
            },
            hobbies_and_leisure: {
              value: "Reading novels, gardening, birdwatching, traveling with husband, cooking for family gatherings",
              rationale: "Patient listed several hobbies",
              data_collection_id: "hobbies_and_leisure",
            },
            glasses_independence: {
              value: "Would love to be free of glasses entirely. Has worn glasses for 40 years and finds them increasingly frustrating, especially when gardening in the rain or playing with grandchildren.",
              rationale: "Strong desire for glasses independence",
              data_collection_id: "glasses_independence",
            },
            premium_lens_interest: {
              value: "Very interested — asked multiple questions about multifocal options. Said she'd rather invest more upfront if it means less dependence on glasses.",
              rationale: "Patient expressed strong interest in premium lenses",
              data_collection_id: "premium_lens_interest",
            },
            surgical_readiness: {
              value: "Ready to proceed. Already arranged transportation with daughter. Asked about recovery timeline so she can plan her garden schedule around it.",
              rationale: "Patient is fully ready",
              data_collection_id: "surgical_readiness",
            },
            concerns_and_questions: {
              value: "Worried about recovery time — wants to know when she can get back to gardening. Also asked if she'll be able to read to her grandchildren without glasses after surgery.",
              rationale: "Patient had specific practical concerns",
              data_collection_id: "concerns_and_questions",
            },
            medical_history: {
              value: "Controlled hypertension (lisinopril 10mg), mild arthritis. No diabetes. No previous eye surgeries. No bleeding disorders.",
              rationale: "Patient provided medical history",
              data_collection_id: "medical_history",
            },
            patient_sentiment: {
              value: "Optimistic and engaged",
              rationale: "Patient was enthusiastic throughout the call",
              data_collection_id: "patient_sentiment",
            },
            femtosecond_laser: {
              value: "Interested — liked the idea of more precision. Asked about cost difference vs standard.",
              rationale: "Patient was open to laser-assisted surgery",
              data_collection_id: "femtosecond_laser",
            },
            personality_assessment: {
              value: "Warm, detail-oriented, practical decision-maker. Asks thorough questions.",
              rationale: "Observed throughout the conversation",
              data_collection_id: "personality_assessment",
            },
          },
          evaluation_criteria_results: {
            information_gathering: {
              result: "success",
              rationale: "All key data points were collected successfully",
              criteria_id: "information_gathering",
            },
            patient_education: {
              result: "success",
              rationale: "Patient was well-informed about options and asked follow-up questions",
              criteria_id: "patient_education",
            },
          },
        },
        transcript: [
          { role: "agent", message: "Hello! I'm calling from Dr. Chen's office regarding your upcoming cataract consultation. Is this Margaret?", time_in_call_secs: 0 },
          { role: "user", message: "Yes, this is Margaret. I've been expecting your call!", time_in_call_secs: 5 },
          { role: "agent", message: "Wonderful! I'd like to ask you some questions to help Dr. Chen prepare for your appointment. First, could you tell me how your vision has been affecting your daily life?", time_in_call_secs: 12 },
          { role: "user", message: "Oh, it's gotten quite bad. I can't read to my grandchildren anymore, and I've had to stop driving at night completely.", time_in_call_secs: 22 },
        ],
      },
    },
  });

  // ── Patient 2: Moderate propensity, unreviewed ──
  const p2 = await prisma.patient.upsert({
    where: { id: "seed-patient-2" },
    update: {},
    create: {
      id: "seed-patient-2",
      name: "Robert Alvarez",
      firstName: "Robert",
      lastName: "Alvarez",
      phone: "(555) 345-6789",
      email: "r.alvarez@email.com",
      dateOfBirth: dob(67, -3),
      appointmentDate: todayAt(10, 30),
      doctor: "Dr. Chen",
      callStatus: "called",
    },
  });

  await prisma.webhookEvent.upsert({
    where: { conversationId: "seed-conv-2" },
    update: {},
    create: {
      id: "seed-call-2",
      type: "post_call_transcription",
      eventTimestamp: Math.floor((todayAt(10, 30).getTime() - 4 * 86400000) / 1000),
      agentId: "agent_cataract_screening",
      conversationId: "seed-conv-2",
      status: "done",
      callSuccessful: true,
      callDurationSecs: 342,
      visionScale: 6,
      activities: "golf, woodworking, watching sports",
      visionPreference: "Don't mind reading glasses, but want clear distance vision",
      patientId: p2.id,
      data: {
        metadata: {
          call_duration_secs: 342,
          cost: 0.35,
          start_time_unix_secs: Math.floor((todayAt(10, 30).getTime() - 4 * 86400000) / 1000),
          charging: { llm_price: 0.25, call_charge: 0.35 },
        },
        analysis: {
          call_successful: true,
          transcript_summary:
            "Robert is a 67-year-old semi-retired accountant who plays golf 3 times a week. His main concern is distance vision for golf and driving. He's open to premium lenses but wants to understand the cost-benefit. He's somewhat hesitant about surgery but acknowledges his vision is getting worse. He'd be okay with reading glasses if his distance vision is sharp.",
          data_collection_results: {
            patient_name: {
              value: '{"patient_name": "Robert Alvarez", "occupation": "Semi-retired accountant"}',
              rationale: "Patient provided name and occupation",
              data_collection_id: "patient_name",
            },
            occupation_and_job: {
              value: "Semi-retired accountant, still does tax prep seasonally. Spends most of his time on the golf course.",
              rationale: "Patient described his work and lifestyle",
              data_collection_id: "occupation_and_job",
            },
            vision_impact_scale: {
              value: "6",
              rationale: "Patient rated vision impact as 6/10",
              data_collection_id: "vision_impact_scale",
            },
            daily_activities_affected: {
              value: "Golf — can't track the ball after hitting. Has trouble reading the greens. Driving is okay during the day but night driving is getting harder. Woodworking requires a magnifying lamp now.",
              rationale: "Patient described moderate activity limitations",
              data_collection_id: "daily_activities_affected",
            },
            hobbies_and_leisure: {
              value: "Golf (3x/week), woodworking, watching football, occasional fishing trips",
              rationale: "Patient listed hobbies",
              data_collection_id: "hobbies_and_leisure",
            },
            glasses_independence: {
              value: "Reading glasses are fine — just wants clear distance vision for golf and driving. Doesn't mind wearing readers.",
              rationale: "Patient has moderate glasses independence desire",
              data_collection_id: "glasses_independence",
            },
            premium_lens_interest: {
              value: "Maybe — interested but wants to know the cost difference. Worried it might not be worth the extra money if he's okay with reading glasses.",
              rationale: "Patient is considering but not committed",
              data_collection_id: "premium_lens_interest",
            },
            surgical_readiness: {
              value: "Considering it. Wants to hear what the doctor thinks first. Leaning toward doing it soon since golf season is starting.",
              rationale: "Patient is in the considering stage",
              data_collection_id: "surgical_readiness",
            },
            concerns_and_questions: {
              value: "How long until he can play golf again after surgery? Worried about dry eye — heard it's a common side effect.",
              rationale: "Patient had specific activity-related concerns",
              data_collection_id: "concerns_and_questions",
            },
            medical_history: {
              value: "Type 2 diabetes (well-controlled, A1c 6.2), takes metformin. Had knee replacement 2 years ago. No eye surgeries.",
              rationale: "Patient provided medical history",
              data_collection_id: "medical_history",
            },
            patient_sentiment: {
              value: "Cautiously optimistic",
              rationale: "Patient was open but measured in his responses",
              data_collection_id: "patient_sentiment",
            },
            femtosecond_laser: {
              value: "Not sure — wants doctor's recommendation on whether it's necessary",
              rationale: "Patient was neutral on laser option",
              data_collection_id: "femtosecond_laser",
            },
          },
          evaluation_criteria_results: {
            information_gathering: {
              result: "success",
              rationale: "Successfully collected all key screening data",
              criteria_id: "information_gathering",
            },
          },
        },
        transcript: [
          { role: "agent", message: "Hi, is this Robert? I'm calling from Dr. Chen's office about your cataract consultation.", time_in_call_secs: 0 },
          { role: "user", message: "Yeah, that's me. What do you need?", time_in_call_secs: 4 },
        ],
      },
    },
  });

  // ── Patient 3: Already reviewed ──
  const p3 = await prisma.patient.upsert({
    where: { id: "seed-patient-3" },
    update: {},
    create: {
      id: "seed-patient-3",
      name: "Dorothy Kim",
      firstName: "Dorothy",
      lastName: "Kim",
      phone: "(555) 456-7890",
      email: "dorothy.k@email.com",
      dateOfBirth: dob(78, -6),
      appointmentDate: todayAt(14, 0),
      doctor: "Dr. Chen",
      callStatus: "called",
      notes: "Long-time patient. Prefers gentle communication. Daughter usually joins appointments.",
    },
  });

  await prisma.webhookEvent.upsert({
    where: { conversationId: "seed-conv-3" },
    update: {},
    create: {
      id: "seed-call-3",
      type: "post_call_transcription",
      eventTimestamp: Math.floor((todayAt(14, 0).getTime() - 6 * 86400000) / 1000),
      agentId: "agent_cataract_screening",
      conversationId: "seed-conv-3",
      status: "done",
      callSuccessful: true,
      callDurationSecs: 298,
      visionScale: 7,
      activities: "reading, watching TV, knitting",
      visionPreference: "Just wants to see clearly again",
      patientId: p3.id,
      reviewedAt: new Date(),
      data: {
        metadata: {
          call_duration_secs: 298,
          cost: 0.28,
          start_time_unix_secs: Math.floor((todayAt(14, 0).getTime() - 6 * 86400000) / 1000),
          charging: { llm_price: 0.20, call_charge: 0.28 },
        },
        analysis: {
          call_successful: true,
          transcript_summary:
            "Dorothy is a 78-year-old retired nurse who lives with her daughter. Her vision has deteriorated significantly — she can no longer knit or read comfortably. She is not interested in premium lenses and prefers the standard option. She's ready for surgery but nervous about the procedure itself. Her daughter helped answer some questions during the call.",
          data_collection_results: {
            patient_name: {
              value: '{"patient_name": "Dorothy Kim", "occupation": "Retired nurse"}',
              rationale: "Patient provided name",
              data_collection_id: "patient_name",
            },
            occupation_and_job: {
              value: "Retired nurse (35 years in pediatrics). Now mostly at home, helps daughter with grandchildren.",
              rationale: "Patient shared background",
              data_collection_id: "occupation_and_job",
            },
            vision_impact_scale: {
              value: "7",
              rationale: "Patient rated impact at 7/10",
              data_collection_id: "vision_impact_scale",
            },
            daily_activities_affected: {
              value: "Cannot knit anymore — her main hobby for decades. Reading requires very strong magnification. TV is blurry even from close distance. Has trouble recognizing faces at the grocery store.",
              rationale: "Significant daily impact described",
              data_collection_id: "daily_activities_affected",
            },
            hobbies_and_leisure: {
              value: "Knitting (currently unable), reading mystery novels, watching Korean dramas, playing cards with friends",
              rationale: "Patient listed hobbies",
              data_collection_id: "hobbies_and_leisure",
            },
            glasses_independence: {
              value: "Doesn't mind glasses — has worn them her whole life. Just wants to see well enough to knit and read again.",
              rationale: "Low priority on glasses independence",
              data_collection_id: "glasses_independence",
            },
            premium_lens_interest: {
              value: "Not interested — prefers standard lens. Daughter asked about premium options but Dorothy said she just wants reliable basic vision improvement.",
              rationale: "Patient declined premium option",
              data_collection_id: "premium_lens_interest",
            },
            surgical_readiness: {
              value: "Ready but nervous. Daughter will be present for support. Wants to get it done so she can knit Christmas gifts.",
              rationale: "Patient is ready with some anxiety",
              data_collection_id: "surgical_readiness",
            },
            concerns_and_questions: {
              value: "Nervous about being awake during the procedure. Wants to know exactly what she'll feel. Also concerned about eye drops schedule after — wants to make sure her daughter can help.",
              rationale: "Patient had anxiety-related concerns",
              data_collection_id: "concerns_and_questions",
            },
            medical_history: {
              value: "Osteoporosis, mild macular degeneration (dry type, stable), controlled cholesterol. Takes alendronate and atorvastatin. No diabetes.",
              rationale: "Patient provided detailed medical history",
              data_collection_id: "medical_history",
            },
            patient_sentiment: {
              value: "Anxious but determined",
              rationale: "Patient showed nervousness but strong motivation",
              data_collection_id: "patient_sentiment",
            },
            personality_assessment: {
              value: "Gentle, thorough (former nurse), appreciates detailed explanations. Relies on daughter for decision support.",
              rationale: "Observed patient communication style",
              data_collection_id: "personality_assessment",
            },
          },
          evaluation_criteria_results: {
            information_gathering: {
              result: "success",
              rationale: "All data collected with daughter's help",
              criteria_id: "information_gathering",
            },
          },
        },
        transcript: [
          { role: "agent", message: "Hello, may I speak with Dorothy Kim? This is a call from Dr. Chen's office.", time_in_call_secs: 0 },
          { role: "user", message: "Yes, this is Dorothy. My daughter Susan is here with me too, if that's okay.", time_in_call_secs: 6 },
        ],
      },
    },
  });

  // ── Patient 4: No screening call yet ──
  await prisma.patient.upsert({
    where: { id: "seed-patient-4" },
    update: {},
    create: {
      id: "seed-patient-4",
      name: "James Okafor",
      firstName: "James",
      lastName: "Okafor",
      phone: "(555) 567-8901",
      email: "james.okafor@email.com",
      dateOfBirth: dob(64, -1),
      appointmentDate: todayAt(15, 30),
      doctor: "Dr. Chen",
      callStatus: "queued",
    },
  });

  console.log("Seeded 4 patients (3 with calls, 1 without)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
