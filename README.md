# DSV Internship Frontend

This is the frontend project for the PI Pdf system, built with **Next.js** and **TypeScript**.

## Tech Stack

- **Next.js** (React Framework)
- **TypeScript**
- **TailwindCSS** (UI Styling)
- **NextAuth.js** (Authentication & Authorization)
- **PDFTron/WebViewer** (PDF display & annotation)
- **ESLint, Prettier** (Code formatting, code style)

## Getting Started

### 1. Clone the repository

~

```bash
git clone https://github.com/trungnhDSV/dsv-intership-frontend.git
cd dsv-intership-frontend
```

### 2. Install dependencies and set up PDFTron

```bash
npm i
npm run copy-webviewer
```

### 3. Environment Variables

Create a `.env.local` file in the root directory with the following fields:

| Variable                          | Description                                                                                                                      | Example / How to set up                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`                | Google OAuth client ID for authentication.                                                                                       | [How to set up](https://next-auth.js.org/providers/google) <br> `GOOGLE_CLIENT_ID=your_google_client_id`                                  |
| `GOOGLE_CLIENT_SECRET`            | Google OAuth client secret.                                                                                                      | [How to set up](https://next-auth.js.org/providers/google) <br> `GOOGLE_CLIENT_SECRET=your_google_client_secret`                          |
| `NEXT_PUBLIC_API_URL`             | The URL of your backend API.                                                                                                     | `NEXT_PUBLIC_API_URL=http://localhost:8080`                                                                                               |
| `AUTH_SECRET`                     | A long, random secret key used to sign and verify authentication tokens (such as JWT). Must be the same on all backend services. | [Generate](https://generate-random.org/string-generator?count=1&length=64) <br> `AUTH_SECRET=your_secret`                                 |
| `NEXT_PUBLIC_PDFTRON_LICENSE_KEY` | PDFTron WebViewer license key.                                                                                                   | [How to get trial key](https://docs.apryse.com/core/guides/get-started/trial-key) <br> `NEXT_PUBLIC_PDFTRON_LICENSE_KEY=your_license_key` |

---

#### **Sample `.env.local`**

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_API_URL=http://localhost:8080
AUTH_SECRET=your_super_long_random_secret
NEXT_PUBLIC_PDFTRON_LICENSE_KEY=your_pdftron_license_key
```

### 4. Run application

```bash
npm run dev
```
