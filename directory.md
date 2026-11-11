# Directory

Every market in [`markets/`](markets/), one line each. [`build/check.sh`](build/check.sh) writes
this file and [`directory.json`](directory.json) from the market files; nobody edits either by
hand. What a market is: [`README.md`](README.md).

A live market needs no payment between people yet, is polished, and from now on only grows. A
beta market works, at your own risk, and may still change in any way.

- [`clothing`](markets/clothing.json) (beta): People sell clothes and shoes they own, picked up in person or shipped. Roles: seller (offers), buyer (requests).
- [`electronics`](markets/electronics.json) (beta): People sell phones, laptops, consoles and other electronics they own, picked up in person or shipped. Roles: seller (offers), buyer (requests).
- [`home-cleaning`](markets/home-cleaning.json) (beta): Cleaners clean people's homes, by the hour or per visit, often every week. Roles: cleaner (offers), client (requests).
- [`home-repair`](markets/home-repair.json) (beta): People fix things in other people's homes, such as plumbing, electrical work and small repairs, paid per hour or per job. Roles: repairer (offers), client (requests).
- [`software-development`](markets/software-development.json) (beta): People write software for others, remotely, paid per job or per hour. Roles: developer (offers), client (requests).
- [`sports-coaching`](markets/sports-coaching.json) (beta): Coaches teach a sport one on one or in small groups, paid per session or per hour, in person or online. Roles: coach (offers), student (requests).
- [`tennis-matches`](markets/tennis-matches.json) (beta): Tennis players find someone to play a match with, for no money. Roles: player (requests).
- [`tutoring`](markets/tutoring.json) (beta): Tutors help students with school subjects one on one, paid per hour or per session, in person or online. Roles: tutor (offers), student (requests).
