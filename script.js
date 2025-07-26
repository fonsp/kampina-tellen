const writeCsv = (list) =>
  list.length === 0 ? "" :
    [
      Object.keys(list[0]).map(
        s => JSON.stringify(s)
      ).join(","),
      ...list.map(obj =>
        Object.values(obj).map(
          s => s == null ? "" :
            s instanceof Date ? s.toISOString() :
              JSON.stringify(s)
        ).join(",")
      )
    ].join("\n")





if(window.location.protocol === "http:"){
  if(!["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname)){
    window.location.protocol = "https:"
  }
}





try {
  const location = {
    tracking: false,
    trackId: undefined,
    value: undefined,
  };

  let q = (...a) => document.querySelector(...a);
  let qAll = (...a) => document.querySelectorAll(...a);

  let triggeranim = (el, classname) => {
    el.classList.remove(classname);
    el.offsetWidth;
    el.classList.add(classname);
  };

  let flash = (el) => triggeranim(el, "flash");

  const geo_options = {
    enableHighAccuracy: true,
    maximumAge: 1000,
  }

  q(".start-location").addEventListener("click", () => {
    navigator.geolocation.clearWatch(location.watchId);

    let locstatus = q(`.status.location output`);

    locstatus.innerText = `🟠 🔍`;

    let success = (position) => {
      flash(q(`.status.location`));
      // let icon = locstatus.innerText.startsWith("👍") ? "✅" : "👍";
      let icon = "✅";
      locstatus.innerText = `${icon} ± ${Math.ceil(position.coords.accuracy)}m`;
      location.tracking = true;
      location.value = position;
      q(
        `input[name="location"]`
      ).value = `${position.coords.longitude}, ${position.coords.latitude}`;
    };

    let onerror = (err) => {
      locstatus.innerText = `❌`;
      console.error("geoloc err", err);
      alert(err.message);
      location.tracking = false;
    };

    navigator.geolocation.getCurrentPosition((p) => {
      success(p);
      location.watchId = navigator.geolocation.watchPosition(success, onerror, geo_options);
    }, onerror, geo_options);
  });

  let log = [];
  let observationsSaved = true; // Track if observations have been saved since last change
  try {
    log = JSON.parse(localStorage.getItem("laatste_log_v2")) ?? [];
  } catch (err) { }

  console.log(writeCsv(log))

  let filename_input = q("input.filename")


  const update_log = () => {
    q(`.status.observations output`).innerText = log.length;

    // localstorage
    localStorage.setItem("laatste_log_v2", JSON.stringify(log));

    // bestandsnaam
    let filename = filename_input.value !== "" ?
      filename_input.value :
      `telling ${(new Date()).toUTCString()}`;

    // downloadbestand
    let contents_json = JSON.stringify(log, null, 0);
    let contents_csv = writeCsv(log);

    let setFile = (a, contents, filename, filetype) => {
      URL.revokeObjectURL(a.href);
      a.href = URL.createObjectURL(
        new Blob([contents], {
          type: filetype,
        })
      );
      a.download = filename;
    }

    setFile(q("a.log.json"), contents_json, `${filename}.json`, "application/json")
    setFile(q("a.log.csv"), contents_csv, `${filename}.csv`, `text/csv`)

  };

  update_log();


  filename_input.addEventListener("input", e => {
    update_log()
  })


  qAll("aantal-input").forEach((el) => {
    const zz = `fdsasdf${String(Math.random()).slice(2)}`;

    for (
      let i = Number(el.getAttribute("min") ?? 0);
      i <= Number(el.getAttribute("max") ?? 20);
      i++
    ) {
      const button = document.createElement("input");
      button.type = "radio";
      button.name = zz;
      button.value = i;
      button.required = el.getAttribute("required") != null;

      const label = document.createElement("label");
      label.classList.toggle("zero", i === 0);
      label.innerText = i === 0 ? "0 (geen)" : i;
      label.prepend(button);
      el.appendChild(label);
    }
    Object.defineProperty(el, "value", {
      get: () => {
        const checked = el.querySelector("input[type=radio]:checked");
        return !!checked ? Number(checked.value) : null;
      },
    });
  });

  const form = q("form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!location.tracking) {
      alert(
        "De geolocatie is nog niet bekend. Ga terug naar het eerste scherm om geolocatie te starten."
      );
      return;
    }

    log = [
      ...log,
      {
        date: new Date(),
        locatie_lon: location.value?.coords?.longitude,
        locatie_lat: location.value?.coords?.latitude,
        locatie_foutmarge_meter: location.value?.coords?.accuracy,
        stammen: form.querySelectorAll("aantal-input")[0].value,
        knoppen: form.querySelectorAll("aantal-input")[1].value,
        eitjes: form.querySelectorAll("aantal-input")[2].value,
      },
    ];
    observationsSaved = false; // Mark as unsaved since new observation was added
    update_log();
    flash(q(`.status.observations`));
    triggeranim(q(".woohoo"), "show");

    //   Reset form
    form
      .querySelectorAll("input[type=radio]")
      .forEach((r) => (r.checked = false));
  });

  q(`.delete_observations`).addEventListener("click", (e) => {
    // Check if there are unsaved observations
    if (log.length > 0 && !observationsSaved) {
      if (!confirm(
        "⚠️ Waarschuwing: Je hebt observaties die nog niet zijn opgeslagen!\n\n" +
        "Als je doorgaat verlies je al je niet-opgeslagen gegevens.\n\n" +
        "Weet je zeker dat je ze wilt verwijderen?"
      )) {
        return; // User wants to save first, abort deletion
      }
    }
    
    if (
      confirm(
        "Weet je zeker dat je alle observaties wilt verwijderen?\n\nDit kan je niet ongedaan maken."
      )
    ) {
      log = [];
      observationsSaved = true; // Reset saved status since there are no observations
      update_log();
    }
  });

  const footerbuttons = Array.from(qAll("footer button"));
  footerbuttons.forEach((el, i) => {
    el.addEventListener("click", () => {
      let carousel = q(".carousel");
      let width = carousel.children[0].offsetWidth;

      let currentinframe = Math.round(carousel.scrollLeft / width);
      let next = currentinframe + (2 * i - 1);

      console.log({ width, next });
      carousel.scrollTo({
        left: next * width,
        behavior: "smooth",
      });
    });
  });

  // Handle CSV download click
  q("a.log.csv").addEventListener("click", () => {
    // Mark observations as saved
    observationsSaved = true;
    
    // Show the save message
    const saveMessage = q(".save-message");
    saveMessage.classList.add("show");
    
    // Remove highlighting later
    setTimeout(() => {
      saveMessage.classList.remove("show");
    }, 30 * 1000);
  });

  // const submit = form.querySelector(`input[type="submit"]`)
} catch (err) {
  alert(err.message);
  throw (err)
}
