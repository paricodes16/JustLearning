# How to put Huelab on GitHub (step by step)

You will end up with a live link like:
`https://YOUR-USERNAME.github.io/YOUR-REPO/huelab/`

GitHub Pages must already be switched on for the repo (Settings → Pages → Deploy from a branch → `main` → `/ (root)`).
If you followed the earlier steps, it already is.

---

## Option A: Codespaces (recommended)

1. **Download** `huelab.zip` to your computer. Do not unzip it.
2. Open your repo on github.com. Click the green **Code** button, then the **Codespaces** tab, then your existing codespace.
   (If there is none, click **Create codespace on main**.)
3. In the **Explorer** panel on the left, **drag `huelab.zip`** into the file list.
   (Or right-click an empty area of the Explorer and choose **Upload...**)
4. Click inside the **Terminal** at the bottom and run:
   ```
   unzip huelab.zip
   ```
   If it says `unzip: command not found`, use this instead:
   ```
   python3 -m zipfile -e huelab.zip .
   ```
5. Delete the zip so it is not uploaded too:
   ```
   rm huelab.zip
   ```
6. Check that the folder looks right:
   ```
   ls huelab
   ```
   You should see: `README.md  css  index.html  js  tests` (plus this file).
   If you see another `huelab` folder inside, the zip was extracted twice. Run `rm -r huelab` and repeat from step 4.
7. (Optional) Run the tests:
   ```
   node huelab/tests/color.test.js
   ```
   It should end with `44 checks passed`.
8. Save it to GitHub:
   ```
   git add huelab
   git commit -m "Add Huelab colour theory app"
   git push
   ```
9. Wait 1 to 2 minutes, then open:
   `https://YOUR-USERNAME.github.io/YOUR-REPO/huelab/`
   (Check the **Actions** tab on GitHub: a green tick means it is live.)
10. **Stop your codespace** so it does not use your free hours: click the blue **Codespaces** button at the bottom left, then **Stop Current Codespace**.

---

## Option B: without Codespaces (website only)

1. **Unzip** `huelab.zip` on your computer. You will get a folder called `huelab`.
2. On github.com open your repo, click **Add file → Upload files**.
3. **Drag the whole `huelab` folder** (the folder itself, not the files inside it) onto the page.
   Use Chrome or Edge. GitHub keeps the subfolders (`css`, `js`, `tests`).
4. Wait for the upload to finish, type a message such as `Add Huelab`, and click **Commit changes**.
5. Wait 1 to 2 minutes and open the live link above.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| Page not found (404) | Wait 2 minutes and refresh. Check the **Actions** tab for a green tick. Make sure the link ends with `/huelab/` |
| The page is blank or has no styling | The `css` and `js` folders did not upload. Check on github.com that `huelab/css/style.css` and `huelab/js/app.js` exist |
| Files are called `style (1).css` or `app (1).js` | Your computer renamed duplicates. Rename them back exactly, for example `git mv "huelab/js/app (1).js" huelab/js/app.js` |
| I changed something but the live page looks the same | Press `Ctrl + Shift + R` (or `Cmd + Shift + R` on a Mac) to force a fresh load |
| `git push` is rejected | Run `git pull`, then `git push` again |
| Your paintings disappeared | They are stored in your browser. A different browser or cleared data starts fresh |

---

## What is in the folder

```
huelab/
├── index.html           open this to run the app
├── README.md            what it does and how it works
├── HOW-TO-PUBLISH.md    this file
├── css/style.css
├── js/                  the app (color, templates, lessons, paint, wheel, state, views, app)
└── tests/               color.test.js (Node) and browser-smoke.js (optional)
```

To try it locally without GitHub, just double-click `index.html`.
