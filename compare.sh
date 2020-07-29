#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
URL_PATH=$( gsed -r 's/^.+?:\/\/[^\/]+\///' <<< $1 )
SESSION=$( git branch 2>&1 | ggrep '*' | ggrep -oP '[^ ]+$' | ggrep -ioP '[^/]+$' )

# Config
DEV_SITE="absolutart.com.dev.synot.io"
DEV_PROTO="http"
DEV_TEXT="dev"
PROD_SITE="feature-a-absolut-art-multisite.pantheonsite.io"
PROD_PROTO="https"
PROD_TEXT="prod"


if [[ "$SESSION" == "" ]]; then
	SESSION=$2
fi

function generateSideBySide() {
	pushd images/$SESSION
	doing "Generating side-by-side images"
	find . -type f -iname $DEV_SITE\* | while read line; do
		side_by_side_name=$(sed 's/'$DEV_SITE'/side_by_side/' <<< $line)
		comparison=$(sed 's/'$DEV_SITE'/'$PROD_SITE'/' <<< $line )
		diff=$(sed 's/'$DEV_SITE'/diff/' <<< $line )
		if [[ -f $side_by_side_name ]]; then
			rm $side_by_side_name
		fi

		magick $line $comparison $diff +append $side_by_side_name
	done
	popd
}

function addEnvText() {
	file=$1
	text=$2
	output_file=$3
	convert $file \( -size 153x -background "rgba(255,215,0,0.5)" label:"$text" \) -geometry +67+60 -compose over -composite $output_file
}

function addAllEnvText() {
	env=$1
	text=$2
	doing "Adding labels for $env"
	mkdir -p images/$SESSION/tmp
	find images/$SESSION -type f -iname $env\* | while read line; do
		filename=$(sed 's/images\/'$SESSION'\///' <<< $line)
		addEnvText $line $text images/$SESSION/tmp/$filename
	done

	mv images/$SESSION/tmp/* images/$SESSION/
	rm -fr images/$SESSION/tmp
}

function doing() {
	what=$*
	echo "${what}..."
}

function save_screenshots() {
	url=$1
	session=$2
	doing "Saving screenshots for $url $session"
	doing "Saving screenshots for $url"
	node $SCRIPT_DIR/example.js -u $url -s $SESSION
}

function save_diffs() {
	find images/$SESSION -type f -maxdepth 1 -iname $DEV_SITE\* | while read line; do
		production_image=$(gsed 's/'$DEV_SITE'/'$PROD_SITE'/' <<< $line)
		diff_image=$(gsed 's/'$DEV_SITE'/diff/' <<< $line)
		node $SCRIPT_DIR/compare.js $line $production_image $diff_image
	done
}

function compare_sites() {
	save_screenshots $DEV_PROTO://$DEV_SITE/$URL_PATH $SESSION
	save_screenshots $PROD_PROTO://$PROD_SITE/$URL_PATH $SESSION
}

function compare_branches() {

	save_screenshots $DEV_PROTO://$DEV_SITE/$URL_PATH $SESSION

}

mkdir -p images/$SESSION
compare_sites
save_diffs

addAllEnvText $DEV_SITE $DEV_TEXT
addAllEnvText $PROD_SITE $PROD_TEXT
addAllEnvText diff diff

generateSideBySide

doing "Deleting seperate images"
rm images/$SESSION/$DEV_SITE*
rm images/$SESSION/$PROD_SITE*
rm images/$SESSION/diff*

echo "All done."
echo "Results can be viewed at $(pwd)/images/$SESSION"
