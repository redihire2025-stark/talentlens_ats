/** Test-only resume texts shared by the AI-assisted parsing tests. Not imported by app code. */

/** Title and company run together with single spaces, and no email/phone — two real parser warnings. */
export const MESSY_RESUME = `Dana Okafor
Chicago IL
linkedin: https://www.linkedin.com/in/danaokafor

Experience
Staff Software Engineer Globex Corporation Mar 2019 - Present
- Led the migration of 40 services to Kubernetes.
- Designed a Kafka-based event bus used by 12 teams.

Skills
TypeScript, Go, PostgreSQL, Kubernetes

Education
University of Illinois, B.S. Computer Science, 2011 - 2015
`

/** No recognizable skills or experience headings at all. */
export const NO_SECTIONS_RESUME = `Sam Lee
sam.lee@example.com | 555-010-7788

About me
Backend developer. Toolbox: Python, Django, Redis.

Where I have worked
Backend Developer at Initech, Jan 2018 - Dec 2021
Built billing APIs serving 3 million customers.
`
