# Directory

Every market in [`markets/`](markets/), one line each. [`build/check.sh`](build/check.sh) writes
this file and [`directory.json`](directory.json) from the market files; nobody edits either by
hand. What a market is: [`README.md`](README.md).

A live market needs no payment between people yet, is polished, and from now on only grows. A
beta market works, at your own risk, and may still change in any way.

- [`goods-selling`](markets/goods-selling.json) (beta): Buy and sell everyday things, new or used. Selling, not renting; not motor vehicles or homes. If it has to be shipped, keep to things you could afford to lose. Roles: seller (offers), buyer (requests).
- [`home-cleaning`](markets/home-cleaning.json) (beta): Find someone to clean your home, or offer to clean. Cleaning in a home. Repairs are home-repair, and garden work is home-gardening. Roles: cleaner (offers), client (requests).
- [`home-gardening`](markets/home-gardening.json) (beta): Find help with your garden, or offer yours. Caring for a garden, not landscaping, building or felling trees. Repairs are home-repair, and cleaning is home-cleaning. Roles: gardener (offers), client (requests).
- [`home-repair`](markets/home-repair.json) (beta): Find someone for repairs and small jobs at home, or offer to do them. Repairs and small jobs in a home, not renovations or building work. Garden work is home-gardening, and cleaning is home-cleaning. Roles: repairer (offers), client (requests).
- [`language-exchange`](markets/language-exchange.json) (beta): Practise a language with someone who wants to practise yours. For adults only, practising for free; paid lessons are tutoring. Roles: partner (requests).
- [`software-development`](markets/software-development.json) (beta): Find a developer for your project, or find projects to build. Software, AI, data and automation, built and fixed remotely. Security work included; not design alone, video or hardware. Roles: developer (offers), client (requests).
- [`sports-coaching`](markets/sports-coaching.json) (beta): Find or become a coach, in any sport or in fitness. Sport and fitness; desk subjects and chess are tutoring. The student is whoever arranges the coaching, often a parent, who stays present for a child's session in person. Roles: coach (offers), student (requests).
- [`stays-free`](markets/stays-free.json) (beta): Find a free place to stay, or host a traveller. For adults only, staying for free; a bed for help is stays-work. Roles: host (offers), guest (requests).
- [`stays-work`](markets/stays-work.json) (beta): Trade your help for a place to stay, or host someone to help you out. For adults only, and never childcare. A free stay with no help is stays-free, and help for a cause with no bed is volunteering. Roles: host (offers), guest (requests).
- [`tours`](markets/tours.json) (beta): Take a tour, or give one. Local guides, in their town or its nature, for adults, who may bring their own children. Learning a sport, such as surfing, is sports-coaching. Roles: guide (offers), guest (requests).
- [`tutoring`](markets/tutoring.json) (beta): Find or become a tutor, in any subject. School subjects, languages and chess; sport and fitness are sports-coaching, and practising a language for free is language-exchange. The student is whoever arranges the lessons, often a parent, who stays present for a child's lesson in person. Roles: tutor (offers), student (requests).
- [`volunteering`](markets/volunteering.json) (beta): Give your time to a cause, or find volunteers for yours. For adults only, online too, and never caring for children or for people who need care. A bed for help is stays-work. Roles: organizer (offers), volunteer (requests).
