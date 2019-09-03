# Version key/value should be on his own line
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')
echo "Tagging Version $PACKAGE_VERSION"
git tag "v$PACKAGE_VERSION"
git push origin "v$PACKAGE_VERSION"
