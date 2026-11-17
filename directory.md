# Directory

Every market in [`markets/`](markets/), one line each. [`build/check.sh`](build/check.sh) writes
this file and [`directory.json`](directory.json) from the market files; nobody edits either by
hand. What a market is: [`README.md`](README.md).

A live market needs no payment between people yet, is polished, and from now on only grows. A
beta market works, at your own risk, and may still change in any way.

- [`home-cleaning`](markets/home-cleaning.json) (beta): Cleaners clean people's homes. Roles: cleaner (offers), client (requests).
- [`home-gardening`](markets/home-gardening.json) (beta): Gardeners mow, prune, plant and care for people's gardens. Each visit or job is paid once it is done, and gardeners often come every week or two; not landscaping or building, which are paid in stages, nor felling trees. Roles: gardener (offers), client (requests).
- [`home-repair`](markets/home-repair.json) (beta): Repairers do plumbing, electrical and handyman jobs in people's homes. Each job is paid once it is done; not renovations paid in stages. Garden work is home-gardening, and cleaning is home-cleaning. Roles: repairer (offers), client (requests).
- [`language-exchange`](markets/language-exchange.json) (beta): Two people practise each other's language, taking turns. Partners meet online or in person, with no money between them; paid lessons are tutoring. For adults. Roles: partner (requests).
- [`software`](markets/software.json) (beta): Developers build and fix software, AI, data and automation, remotely. Building and fixing software of every kind, AI, data, automation and security work included, delivered remotely; not design alone, video or hardware. Pay piece by piece, each piece once delivered, so neither side risks much. Roles: developer (offers), client (requests).
- [`sports-coaching`](markets/sports-coaching.json) (beta): Coaches teach a sport or fitness, one on one or in groups. Coaching is in person or online, paid by the session, the hour, the week of a training plan, the month or a pack; the student is whoever arranges the coaching, often a parent, who stays present for a child's session in person. Desk subjects and chess are tutoring. Roles: coach (offers), student (requests).
- [`tutoring`](markets/tutoring.json) (beta): Tutors teach school subjects, languages, chess and other desk subjects. Lessons are online or in person, paid by the lesson, the hour, a pack of lessons or the month; the student is whoever arranges the lessons, often a parent, who stays present for a child's lesson in person. Sport and fitness are sports-coaching; practising a language for free is language-exchange. Roles: tutor (offers), student (requests).
