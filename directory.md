# Directory

Every market in [`markets/`](markets/), one line each. [`build/check.sh`](build/check.sh) writes
this file and [`directory.json`](directory.json) from the market files; nobody edits either by
hand. What a market is: [`README.md`](README.md).

A live market needs no payment between people yet, is polished, and from now on only grows. A
beta market works, at your own risk, and may still change in any way.

- [`home-cleaning`](markets/home-cleaning.json) (beta): Cleaners clean people's homes. Roles: cleaner (offers), client (requests).
- [`home-gardening`](markets/home-gardening.json) (beta): Gardeners mow, prune, plant and care for people's gardens. Caring for a garden, not landscaping, building or felling trees. Repairs are home-repair, and cleaning is home-cleaning. Roles: gardener (offers), client (requests).
- [`home-repair`](markets/home-repair.json) (beta): Repairers do plumbing, electrical and handyman jobs in people's homes. Repairs and small jobs in a home, not renovations or building work. Garden work is home-gardening, and cleaning is home-cleaning. Roles: repairer (offers), client (requests).
- [`language-exchange`](markets/language-exchange.json) (beta): Two people practise each other's language, taking turns. For adults only, practising for free; paid lessons are tutoring. Roles: partner (requests).
- [`software`](markets/software.json) (beta): Developers build and fix software, AI, data and automation, remotely. Security work included; not design alone, video or hardware. Roles: developer (offers), client (requests).
- [`sports-coaching`](markets/sports-coaching.json) (beta): Coaches teach a sport or fitness, one on one or in groups. Sport and fitness; desk subjects and chess are tutoring. The student is whoever arranges the coaching, often a parent, who stays present for a child's session in person. Roles: coach (offers), student (requests).
- [`tutoring`](markets/tutoring.json) (beta): Tutors teach school subjects, languages, chess and other desk subjects. School subjects, languages and chess; sport and fitness are sports-coaching, and practising a language for free is language-exchange. The student is whoever arranges the lessons, often a parent, who stays present for a child's lesson in person. Roles: tutor (offers), student (requests).
