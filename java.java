import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collector;
import java.util.stream.Collectors;

public class java {
    public static void main(String[] args) {
        String str =  "now is the winter";
        Map<String, Long> collect = Arrays.stream(str.split(""))
        .collect(Collectors.groupingBy(
            Function.identity(),
            Collectors.counting()
        ));
        System.out.println(collect);
    }
}
