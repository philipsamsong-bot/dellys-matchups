"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function FounderPage() {
  return (
    <>
      <SiteNav />

      <main className="min-h-screen overflow-hidden bg-[#080304] pt-36 text-white">
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap");

          body {
            margin: 0;
            background: #080304;
            font-family: "Plus Jakarta Sans", sans-serif;
          }

          .font-display {
            font-family: "Cormorant Garamond", serif;
          }
        `}</style>

        <section className="relative px-6 pb-24">
          <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-[#b30018]/35 blur-3xl" />

          <div className="absolute bottom-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ x: -70, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="overflow-hidden rounded-[3rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl"
            >
              <img
                src="/founder.jpg"
                alt="Delly Singah"
                className="h-[760px] w-full rounded-[2.5rem] object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ x: 70, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <p className="font-bold uppercase tracking-[0.35em] text-red-200">
                About the Founder
              </p>

              <h1 className="font-display mt-5 whitespace-nowrap text-6xl font-bold leading-[0.9] tracking-tighttext-[#ffccd5] md:text-9xl">
                 Delly Singah
              </h1>

              <div className="mt-10 space-y-7 text-lg leading-9 text-white/75">
                <p>
                  Delly Singah is a relationship mentor, counselor, speaker,
                  Author, Media Personality, Wife & Mother and founder of
                  Delly’s Matchups (DMs).
                </p>

                <p>
                  Known affectionately by many followers as “Mummy Delly,” she
                  has inspired and impacted lives globally through her teachings
                  on relationships and marriage rooted in Biblical principles.
                </p>

                <p>
                  Her authentic approach, wisdom, compassion, and dedication to
                  helping others navigate relationships have earned the trust of
                  a vast online community.
                </p>

                <p>
                  Over the years, she has become a respected voice in
                  conversations surrounding love, healing, marriage, emotional
                  growth, and purposeful living.
                </p>

                <p>
                  What began as simple Facebook teachings has now grown into an
                  international movement touching lives across nations.
                </p>

                <p>
                  Through DMs, Delly continues to champion healthy
                  relationships, intentional marriages, and the restoration of
                  authentic family values in modern society.
                </p>
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="/auth/signup"
                  className="rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
                >
                  Join The Movement
                </a>

                <a
                  href="/about/platform"
                  className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-black backdrop-blur-xl transition hover:bg-white/20"
                >
                  About The Platform
                </a>
              </div>
            </motion.div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-6 pb-28">
  <div className="grid gap-6 md:grid-cols-3">
    {[
      [
        "Relationship Mentor",
        "Guiding singles, couples, and families through wisdom, healing, emotional maturity and healthy relationship principles.",
      ],
      [
        "Faith-Based Voice",
        "Teaching relationships and marriage through Biblical values, purpose, authenticity and intentional living.",
      ],
      [
        "Global Impact",
        "An international movement touching lives globally through counselling, mentorship and matchmaking.",
      ],
    ].map(([title, text], index) => (
      <motion.div
        key={title}
        initial={{ y: 60, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.12 }}
        className="rounded-[2.5rem] border border-red-300/20 bg-gradient-to-br from-[#7a0012] via-[#b30018] to-[#4a0008] p-8 shadow-[0_25px_80px_rgba(179,0,24,0.35)]"
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
              Delly Singah
            </p>

            <h3 className="font-display mt-5 text-4xl font-bold leading-tight text-white">
              {title}
            </h3>

            <p className="mt-6 leading-8 text-white/80">
              {text}
            </p>
          </div>

          <div className="mt-10 h-[2px] w-20 bg-white/30" />
        </div>
      </motion.div>
    ))}
  </div>
</section>
<section className="px-6 pb-32">
          <motion.div
            initial={{ y: 70, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-6xl rounded-[3rem] bg-white p-12 text-center text-black shadow-2xl"
          >
            <p className="font-bold uppercase tracking-[0.35em] text-red-700">
              Her Mission
            </p>

            <h2 className="font-display mt-5 text-6xl font-bold leading-none">
              Restoring authentic family values in modern society.
            </h2>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-9 text-black/70">
              Through Delly’s Matchups, Delly continues to champion healthy
              relationships, intentional marriages, emotional healing,
              mentorship and purposeful living.
            </p>
          </motion.div>
        </section>
      </main>
   

<section className="mx-auto max-w-7xl px-6 pb-28">
  <div className="grid items-center gap-14 rounded-[3rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl lg:grid-cols-2 lg:p-12">
    <motion.div
      initial={{ x: -70, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="overflow-hidden rounded-[2.5rem]"
    >
      
      <img
        src="/gallery5.jpg"
        alt="Delly Singah"
        className="h-[680px] w-full rounded-[2.5rem] object-cover"
      />

      
    </motion.div>





    <motion.div
      initial={{ x: 70, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <p className="font-bold uppercase tracking-[0.35em] text-red-200">
        Founder Biography
      </p>

      <h2 className="font-display mt-5 text-6xl font-bold leading-none text-white">
        A voice of impact, purpose, and transformation.
      </h2>

      <div className="mt-8 space-y-6 text-lg leading-9 text-white/75">
        <p>
          Delly Singah is a prominent Cameroonian born, London based Author,
          Humanitarian, Relationship Coach, TV Host and Brand Influencer who
          has made significant impact through her diverse range of roles.
        </p>

        <p>
          She’s known for her unequivocal stance on social issues and has
          dedicated her efforts to promoting social initiatives that inspire
          positive change; notably her ReceiveSense Movement, Cultural Identity
          crusade, NoToStigma, AutismAwareness, and Intentional Living lifestyle
          which have garnered significant attention in Cameroon and around
          Africa.
        </p>

        <p>
          Delly Singah has equally devoted the past decade of her life in
          redefining authentic relationships via her highly revered online
          platform - Delly’s Matchups & Counselling Services with a plethora of
          relationships solutions to her credit.
        </p>

        <p>
          Acknowledged as one of the Top50 Most Influential Cameroonian Youths -
          2018, Delly Singah epitomises the ideals of Panafricanism.
        </p>
      </div>
    </motion.div>
  </div>
</section>
<section className="px-6 pb-32">
  <div className="mx-auto max-w-6xl rounded-[3rem] border border-white/10 bg-gradient-to-br from-[#120608] via-[#1b080b] to-[#2a0b10] p-10 shadow-2xl lg:p-16">
    <motion.div
      initial={{ y: 70, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <p className="font-bold uppercase tracking-[0.35em] text-red-200">
        Leadership & Influence
      </p>

      <h2 className="font-display mt-5 text-6xl font-bold leading-none text-white">
        Building impact beyond relationships.
      </h2>

      <div className="mt-10 space-y-8 text-lg leading-9 text-white/75">
        <p>
          Her tireless advocacy for social inclusion, economic empowerment and
          relationship advancement has earned her numerous accolades,
          nominations and awards both nationally and internationally with the
          recent being; a lifetime achievement award in Social Counselling - an
          outstanding participation in nation building.
        </p>

        <p>
          Dubbed best selling Author of her highly talked about books - I DO, I
          DON’T (2023), Diary of a Special Mum (2024) and most recently
          Adventures of Delphine (2025).
        </p>

        <p>
          Delly Singah is a proud MBA holder in Corporate Finance from the
          University of Wales Institute - Cardiff, a masters holder in
          management from the University of Yaounde II - Soa, with numerous
          Diplomas and online short courses on relationship counselling from
          world renowned universities.
        </p>

        <div className="grid gap-6 pt-4 md:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-7">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-red-200">
              Family
            </p>

            <div className="mt-5 space-y-4 text-white/80">
              <p>Married & Mother</p>
              <p>Husband: Dr. Philip O. Samson</p>
              <p>Child: Favour-Song Philip (Jesus Boy)</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-7">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-red-200">
              Origin
            </p>

            <div className="mt-5 space-y-4 text-white/80">
              <p>From Ngie Subdivision</p>
              <p>Momo Division</p>
              <p>North West Region of Cameroon</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-7">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-red-200">
              Education
            </p>

            <div className="mt-5 space-y-4 text-white/80">
              <p>MBA in Corporate Finance</p>
              <p>Masters in Management</p>
              <p>Relationship Counselling Certifications</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
</section>
<section className="px-6 pb-32">
  <div className="mx-auto max-w-7xl">
    <motion.div
      initial={{ y: 70, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="text-center"
    >
      <p className="font-bold uppercase tracking-[0.35em] text-red-200">
        Awards, Honors & Recognition
      </p>

      <h2 className="font-display mt-5 text-6xl font-bold leading-none text-white lg:text-7xl">
        A legacy of leadership, service and global impact.
      </h2>

      <p className="mx-auto mt-8 max-w-4xl text-lg leading-9 text-white/70">
        Delly Singah’s influence across media, philanthropy and social advocacy
        has earned her numerous prestigious awards in Cameroon, the UK, and the
        global African diaspora.
      </p>
    </motion.div>

    <div className="mt-20 grid gap-6">
      {[
        ["2015", "Sodonwreg Award", "Best Charity Organisation", "Honoring her early humanitarian initiatives and community-focused programs."],
        ["2016", "Oscars UK Award", "Best Charity", "Recognition of her growing charitable footprint within the African diaspora in the UK."],
        ["2018", "Cameroon Women Career Award (CWCA)", "Media Personality of the Year", "Celebrating her rising influence as a media figure and thought leader."],
        ["2018", "Top 50 Most Influential Cameroonian Youths", "Leadership & Social Impact", "Highlighted for her leadership, creativity, and social impact within Cameroon and the diaspora."],
        ["2020", "WCI Awards", "Community Champion of the Year", "Awarded for her dedication to elevating communities and promoting social change."],
        ["2020", "AB Afrikpreneur Awards", "Best Digital Media", "Honoring her innovative Pan-African matchmaking and digital empowerment platform, Delly’s Matchups."],
        ["2020", "BDMA Awards", "Best Social Media Campaign", "Recognizing the viral social-awareness movement #ReceiveSense2020."],
        ["2023", "Lifetime Achievement Award", "Humanity & Social Justice", "For outstanding contributions to humanity and social justice."],
        ["2024", "Goodwill Ambassador", "Ngie Community, Cameroon Diaspora", "A cultural honor bestowed by her home community for philanthropy, cultural promotion, and continued service."],
        ["2024", "Cameroon’s Heroes Awards", "Cameroon Impact Hero", "Celebrating her philanthropic contributions and nationwide influence."],
        ["2024", "New Breed Africa Celebrity Awards", "Diaspora Impact of the Year", "Recognizing her as one of the most influential Cameroonian voices shaping global diaspora conversations."],
        ["2024", "Victoria International Media Awards", "Award for Service to Humanity", "Honoring her media leadership and commitment to using her platform for societal good."],
      ].map(([year, award, title, description], index) => (
        <motion.div
          key={`${year}-${award}`}
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
          className="grid gap-6 rounded-[2.5rem] border border-[#f7d27a]/10 bg-gradient-to-br from-[#2b0006] via-[#5e000d] to-[#1a0004] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)] transition duration-500 hover:scale-[1.01] hover:border-[#f7d27a]/30 md:grid-cols-[140px_1fr]"
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#f8df9a]/40 bg-[radial-gradient(circle_at_top,#fff4cc_0%,#f7d27a_22%,#d4a63f_55%,#7a5200_100%)] text-4xl font-black text-[#2b0006]shadow-[0_0_45px_rgba(247,210,122,0.65)]">
            {year}
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
              {award}
            </p>

            <h3 className="font-display mt-3 text-4xl font-bold leading-tight text-white">
              {title}
            </h3>

            <p className="mt-4 text-lg leading-8 text-white/75">
              {description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
</section>
<section className="mx-auto max-w-7xl px-6 pb-32">
  <div className="grid items-center gap-14 rounded-[3rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl lg:grid-cols-2 lg:p-12">
    <motion.div
      initial={{ x: -70, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="overflow-hidden rounded-[2.5rem]"
    >
      <img
        src="/gallery6.jpg"
        alt="Delly Singah"
        className="h-[720px] w-full rounded-[2.5rem] object-cover"
      />
    </motion.div>

    <motion.div
      initial={{ x: 70, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <p className="font-bold uppercase tracking-[0.35em] text-red-200">
        Legacy & Influence
      </p>

      <h2 className="font-display mt-5 text-6xl font-bold leading-none text-white">
        A Pan-African voice shaping lives across generations.
      </h2>

      <div className="mt-8 space-y-6 text-lg leading-9 text-white/75">
        <p>
          Delly Singah has made significant impact through her diverse range of
          roles as an Author, Humanitarian, Relationship Coach, TV Host and
          Brand Influencer.
        </p>

        <p>
          She is known for her unequivocal stance on social issues and has
          dedicated her efforts to promoting social initiatives that inspire
          positive change; notably her ReceiveSense Movement, Cultural Identity
          crusade, NoToStigma, AutismAwareness, and Intentional Living
          lifestyle.
        </p>

        <p>
          These movements have garnered significant attention in Cameroon and
          around Africa, strengthening her voice as a respected advocate for
          social awareness, cultural identity, healing, and intentional living.
        </p>

        <p>
          Delly Singah has equally devoted the past decade of her life to
          redefining authentic relationships via her highly revered online
          platform — Delly’s Matchups & Counselling Services.
        </p>

        <p>
          Acknowledged as one of the Top 50 Most Influential Cameroonian Youths
          in 2018, Delly Singah epitomises the ideals of Pan-Africanism.
        </p>
      </div>
    </motion.div>
  </div>
</section>

<section className="px-6 pb-32">
  <div className="mx-auto grid max-w-7xl items-center gap-14 rounded-[3rem] bg-[#fff8f5] p-8 text-black shadow-[0_30px_90px_rgba(0,0,0,0.12)] lg:grid-cols-2 lg:p-14">
    <motion.div
      initial={{ x: -70, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <p className="font-bold uppercase tracking-[0.35em] text-[#b30018]">
        Books, Education & Family
      </p>

      <h2 className="font-display mt-5 text-6xl font-bold leading-none">
        Wisdom rooted in experience, education and purpose.
      </h2>

      <div className="mt-10 space-y-8 text-lg leading-9 text-black/75">
        <p>
          Dubbed best selling Author of her highly talked about books ; <br></br>I DO, I
          DON’T (2023), Diary of a Special Mum (2024) and most recently
          Adventures of Delphine (2025).
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {[
            {
              title: "Diary of a Special Mum (2024)",
              image: "/book-diary.jpg",
            },
            {
              title: "Adventures of Delphine (2025)",
              image: "/book-adventures.jpg",
            },
          ].map((book) => (
            <div
              key={book.title}
              className="overflow-hidden rounded-[1.8rem] border border-black/10 bg-white p-4 shadow-lg"
            >
              <img
                src={book.image}
                alt={book.title}
                className="h-90 w-full rounded-[1.4rem] object-cover"
              />

              <p className="mt-5 text-2xl font-bold text-[#b30018]">
                {book.title}
              </p>
            </div>
          ))}
        </div>


      </div>
    </motion.div>

    <motion.div
      initial={{ x: 70, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="overflow-hidden rounded-[2.5rem]"
    >
      <img
        src="/founder-book.jpg"
        alt="Delly Singah"
        className="h-[760px] w-full rounded-[2.5rem] object-cover"
      />
    </motion.div>
  </div>
</section>

<section className="relative overflow-hidden px-6 pb-32">
  <div className="absolute left-[-10%] top-0 h-[420px] w-[420px] rounded-full bg-[#b30018]/30 blur-3xl" />
  <div className="absolute bottom-0 right-[-10%] h-[420px] w-[420px] rounded-full bg-[#f7d27a]/20 blur-3xl" />

  <motion.div
    initial={{ y: 70, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8 }}
    className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem] border border-[#f7d27a]/10 bg-gradient-to-br from-[#2b0006] via-[#7a0012] to-[#160003] px-8 py-20 text-center shadow-[0_35px_120px_rgba(0,0,0,0.45)] lg:px-20"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(247,210,122,0.12),transparent_45%)]" />

    <p className="relative text-sm font-black uppercase tracking-[0.45em] text-[#f7d27a]">
      Join The Movement
    </p>

    <h2 className="font-display relative mt-8 text-6xl font-bold leading-[0.95] text-white md:text-8xl">
      Transforming Lives
      <span className="block text-[#ffccd5]">
        Through Purpose,
      </span>
      Healing & Authentic Relationships
    </h2>

    <p className="relative mx-auto mt-10 max-w-4xl text-xl leading-10 text-white/80">
      Through mentorship, counselling, leadership and transformational
      teachings, Delly Singah continues to inspire individuals and families
      globally to pursue intentional living, emotional healing, healthy
      relationships and purposeful impact.
    </p>

    <p className="relative mx-auto mt-8 max-w-3xl text-lg leading-9 text-white/65">
      Join a growing global community committed to transformation, wisdom,
      authentic connections and generational impact.
    </p>

    <div className="relative mt-14 flex flex-wrap items-center justify-center gap-5">
      <a
        href="/auth/signup"
        className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition duration-300 hover:scale-105"
      >
        Join Delly’s Matchups
      </a>

      <a
        href="/about/platform"
        className="rounded-full border border-white/20 bg-white/10 px-10 py-5 text-lg font-black text-white backdrop-blur-xl transition duration-300 hover:bg-white/20"
      >
        Explore The Platform
      </a>
    </div>
  </motion.div>
</section>

      <SiteFooter />
    </>
  );
}
