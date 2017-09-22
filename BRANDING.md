# (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
# (c) Copyright 2017 SUSE LLC
# Ops Console Branding


To update the branding of the Ops Console UI, several files need to be updated on the branch on which the desired product is being built.

# the following 3 files contain the product name labels displayed to the user
app/locales/en/branding.json
app/locales/ja/branding.json
app/locales/zh/branding.json
for example, to update the titles of the product, change the following entries:
    "branding.product.login.title" : "PRODUCTNAME",
    "branding.pageTitle.title" : "PRODUCTNAME Operations Console",
    "branding.masthead.title": "PRODUCTNAME Operations Console",


# the following file contains the declaration of the login artwork and masthead logos used
app/styles/components/_branding.scss

# the following files need to be replaced with vendor specific files:
images/icons/logos/login-logo.png
images/login-background.png
