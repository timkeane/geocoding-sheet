# Configuration

1.  Once the add-on has loaded, if this is your first use, you will be presented with a `Configuration` page, prompting you to fill out configuration data.
2.  **Geocoder**: this section lets you choose _how_ you want your data geocoded.
    *   If you wish to geocode data within NYC provided by DoITT, select **NYC Geoclient**.
    *   If you wish to geocode data throughout the US using the US Census, select **Census**.
3.  **Geocode-able location definition**: this section lets you define the _parameters_ for your data.
    *   Each parameter represents a column heading in your table.
    *   You should use the format of a templated string with each parameter enclosed in a ${param} as so `${HouseNumber} ${Street}, ${Zip}`.
    *   This is essentially the "single-field" string you will be building to be sent to the Geoclient API.
4.  **Geocode on interval**: check off this box if you want the add-on to automatically geocode data within a pre-defined interval.

The remaining configuration is only applicable for those using the NYC Geoclient:

5.  **Geoclient endpoint**: this section lets you specify _which_ API endpoint you want to use with the NYC Geoclient.
    *   By default, you should be using the URL provided to you when you signed up for access. There are six types of location requests that the NYC Geoclient service provides.
    *   For more information about how to use the NYC Geoclient, check out the documentation [here](https://api.cityofnewyork.us/geoclient/v1/doc).

To use the NYC Geoclient service, you need to have an App ID and App Key, which can be requested via the [API Developer Portal.](https://developer.cityofnewyork.us/api/geoclient-api)
6.  **Geoclient App ID**: this section lets you specify the App ID required for the service to work.
7.  **Geoclient App Key**: this section lets you specify the App Key required for the service to work.
8.  **Possible Geocoded values to append (if available)**: this section lets you specify return values from the NYC Geoclient.

[Back to Index](./index.md)